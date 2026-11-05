package app

import (
	"context"
	"errors"
	"strings"
	"sync/atomic"
	"time"
	"unicode/utf8"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/client"
	"github.com/closeby-corp/clay/prototypes/mygo/internal/protocol"
	"github.com/egoist/mygo"
	"github.com/oneo-me/onevra/source/components"
	"github.com/oneo-me/onevra/source/components/chart"
)

type page string

const (
	pageOverview page = "overview"
	pageJobs     page = "jobs"
	pageMetrics  page = "metrics"
)

type metricKind int

const (
	metricThroughput metricKind = iota
	metricActive
)

type jobForm struct {
	open     bool
	id       string
	name     string
	priority int
	status   string
	err      string
}

// App owns UI state and the authenticated API session for one window.
type App struct {
	api    client.API
	window *mygo.Window

	rootCtx    context.Context
	rootCancel context.CancelFunc
	sessionCtx context.Context
	cancel     context.CancelFunc
	generation uint64
	closed     atomic.Bool

	page           page
	operationsOpen bool
	observeOpen    bool
	loadingUser    bool
	loginBusy      bool
	logoutBusy     bool
	loginError     string
	username       string
	password       string
	user           *protocol.User

	jobs        []protocol.Job
	jobsLoading bool
	jobsError   string
	selectedID  string
	tableState  components.TableState
	form        jobForm
	savingJob   bool

	metrics       []protocol.Metrics
	metricKind    metricKind
	metricState   chart.State
	metricsError  string
	logoutMessage string
}

func New(api client.API) *App {
	ctx, cancel := context.WithCancel(context.Background())
	return &App{
		api: api, rootCtx: ctx, rootCancel: cancel, page: pageOverview, operationsOpen: true,
		loadingUser: true, metricState: chart.State{Index: -1},
	}
}

// Start begins session recovery after the MyGo window has been created.
func (a *App) Start(window *mygo.Window) {
	a.window = window
	ctx, generation := a.newSessionContext()
	a.loadingUser = true
	a.loginError = ""
	go func() {
		user, err := a.api.Session(ctx)
		if ctx.Err() != nil {
			return
		}
		window.Update(func() {
			if a.stale(generation) {
				return
			}
			a.loadingUser = false
			switch {
			case client.IsUnauthorized(err):
				a.user = nil
			case err != nil:
				a.loginError = "Could not reach the API: " + err.Error()
			default:
				a.authenticated(ctx, generation, user)
			}
		})
	}()
}

func (a *App) Close() {
	if !a.closed.CompareAndSwap(false, true) {
		return
	}
	if a.cancel != nil {
		a.cancel()
	}
	a.rootCancel()
}

func (a *App) newSessionContext() (context.Context, uint64) {
	if a.cancel != nil {
		a.cancel()
	}
	a.resetSessionWork()
	ctx, cancel := context.WithCancel(a.rootCtx)
	a.sessionCtx, a.cancel = ctx, cancel
	a.generation++
	return ctx, a.generation
}

func (a *App) resetSessionWork() {
	a.loadingUser = false
	a.loginBusy, a.logoutBusy = false, false
	a.jobsLoading, a.savingJob = false, false
}

func (a *App) stale(generation uint64) bool {
	return a.closed.Load() || generation != a.generation
}

func (a *App) authenticated(ctx context.Context, generation uint64, user protocol.User) {
	if a.stale(generation) {
		return
	}
	a.user = &user
	a.page = pageOverview
	a.operationsOpen = true
	a.loginError = ""
	a.username, a.password = "", ""
	a.jobs, a.metrics = nil, nil
	a.jobsError, a.metricsError, a.logoutMessage = "", "", ""
	a.jobsLoading = true
	a.selectedID = ""
	a.form = jobForm{}
	a.loadJobs(ctx, generation)
	go a.streamMetrics(ctx, generation)
}

func (a *App) login() {
	if a.loginBusy {
		return
	}
	username := strings.TrimSpace(a.username)
	if username == "" || a.password == "" {
		a.loginError = "Enter a username and password."
		return
	}
	ctx, generation := a.newSessionContext()
	a.loginBusy = true
	a.loginError = ""
	window, api, password := a.window, a.api, a.password
	go func() {
		user, err := api.Login(ctx, username, password)
		if ctx.Err() != nil {
			return
		}
		window.Update(func() {
			if a.stale(generation) {
				return
			}
			a.loginBusy = false
			if err != nil {
				a.loginError = err.Error()
				return
			}
			a.authenticated(ctx, generation, user)
		})
	}()
}

func (a *App) logout() {
	if a.logoutBusy || a.api == nil || a.window == nil {
		return
	}
	if a.cancel != nil {
		a.cancel()
	}
	a.sessionCtx = nil
	a.generation++
	a.resetSessionWork()
	generation := a.generation
	a.logoutBusy = true
	a.logoutMessage = ""
	window, api, ctx := a.window, a.api, a.rootCtx
	go func() {
		err := api.Logout(ctx)
		if ctx.Err() != nil {
			return
		}
		window.Update(func() {
			if a.stale(generation) {
				return
			}
			a.finishLogout(err)
		})
	}()
}

func (a *App) finishLogout(err error) {
	a.logoutBusy = false
	if client.IsUnauthorized(err) {
		a.expireSession("Your session expired. Sign in again.")
		return
	}
	if err != nil {
		a.logoutMessage = "Could not sign out: " + err.Error()
		if a.user != nil {
			session, generation := a.newSessionContext()
			a.metricsError = "Reconnecting after sign out failed…"
			a.loadJobs(session, generation)
			go a.streamMetrics(session, generation)
		}
		return
	}
	a.clearUser()
}

func (a *App) clearUser() {
	if a.cancel != nil {
		a.cancel()
	}
	a.sessionCtx = nil
	a.generation++
	a.resetSessionWork()
	a.user = nil
	a.jobs, a.metrics = nil, nil
	a.selectedID = ""
	a.form = jobForm{}
	a.jobsError, a.metricsError = "", ""
	a.loginError, a.logoutMessage = "", ""
	a.username, a.password = "", ""
}

func (a *App) expireSession(message string) {
	if a.cancel != nil {
		a.cancel()
	}
	a.sessionCtx = nil
	a.generation++
	a.resetSessionWork()
	a.user = nil
	a.jobs, a.metrics = nil, nil
	a.jobsError, a.metricsError = "", ""
	a.logoutMessage = ""
	a.loginError = message
	a.form = jobForm{}
}

func (a *App) loadJobs(ctx context.Context, generation uint64) {
	if a.api == nil || a.window == nil {
		return
	}
	window, api := a.window, a.api
	go func() {
		jobs, err := api.Jobs(ctx)
		if ctx.Err() != nil {
			return
		}
		window.Update(func() {
			if a.stale(generation) || a.user == nil {
				return
			}
			a.jobsLoading = false
			if client.IsUnauthorized(err) {
				a.expireSession("Your session expired. Sign in again.")
				return
			}
			if err != nil {
				a.jobsError = err.Error()
				return
			}
			a.jobsError = ""
			a.jobs = jobs
			if a.selectedID != "" && !a.hasJob(a.selectedID) {
				a.selectedID = ""
			}
		})
	}()
}

func (a *App) streamMetrics(ctx context.Context, generation uint64) {
	if a.api == nil || a.window == nil {
		return
	}
	window, api := a.window, a.api
	for ctx.Err() == nil {
		err := api.StreamMetrics(ctx, func(metric protocol.Metrics) {
			if ctx.Err() != nil {
				return
			}
			window.Update(func() {
				if a.stale(generation) || a.user == nil {
					return
				}
				a.metricsError = ""
				if n := len(a.metrics); n > 0 && a.metrics[n-1].Seq == metric.Seq {
					a.metrics[n-1] = metric
				} else {
					a.metrics = append(a.metrics, metric)
					if len(a.metrics) > 60 {
						a.metrics = append([]protocol.Metrics(nil), a.metrics[len(a.metrics)-60:]...)
					}
				}
			})
		})
		if ctx.Err() != nil {
			return
		}
		window.Update(func() {
			if a.stale(generation) || a.user == nil {
				return
			}
			if client.IsUnauthorized(err) {
				a.expireSession("Your session expired. Sign in again.")
				return
			}
			if err != nil {
				a.metricsError = "Stream paused: " + err.Error()
			} else {
				a.metricsError = "Stream ended. Reconnecting…"
			}
		})
		if !pause(ctx, time.Second) {
			return
		}
	}
}

func pause(ctx context.Context, duration time.Duration) bool {
	timer := time.NewTimer(duration)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-timer.C:
		return true
	}
}

func (a *App) refreshJobs() {
	if a.sessionCtx == nil {
		return
	}
	a.jobsLoading, a.jobsError = true, ""
	a.loadJobs(a.sessionCtx, a.generation)
}

func (a *App) newJob() {
	a.route(pageJobs)
	a.selectedID = ""
	a.form = jobForm{open: true, priority: 3, status: "queued"}
}

func (a *App) editSelected() {
	for _, job := range a.jobs {
		if job.ID == a.selectedID {
			a.form = jobForm{open: true, id: job.ID, name: job.Name, priority: job.Priority, status: job.Status}
			return
		}
	}
}

func (a *App) selectedJob() *protocol.Job {
	for i := range a.jobs {
		if a.jobs[i].ID == a.selectedID {
			return &a.jobs[i]
		}
	}
	return nil
}

func (a *App) hasJob(id string) bool {
	for i := range a.jobs {
		if a.jobs[i].ID == id {
			return true
		}
	}
	return false
}

func validateJob(name string, priority int, status string) (protocol.JobInput, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return protocol.JobInput{}, errors.New("Enter a job name.")
	}
	if utf8.RuneCountInString(name) > 120 {
		return protocol.JobInput{}, errors.New("Job name must be 120 characters or fewer.")
	}
	if priority < 1 || priority > 5 {
		return protocol.JobInput{}, errors.New("Choose a priority from 1 to 5.")
	}
	switch status {
	case "queued", "running", "paused":
	default:
		return protocol.JobInput{}, errors.New("Choose queued, running, or paused.")
	}
	return protocol.JobInput{Name: name, Priority: priority, Status: status}, nil
}

func (a *App) saveJob() {
	if a.savingJob {
		return
	}
	input, err := validateJob(a.form.name, a.form.priority, a.form.status)
	if err != nil {
		a.form.err = err.Error()
		return
	}
	a.form.err = ""
	if a.api == nil || a.window == nil || a.sessionCtx == nil {
		return
	}
	a.savingJob, a.form.err = true, ""
	ctx, generation := a.sessionCtx, a.generation
	window, api, id := a.window, a.api, a.form.id
	go func() {
		var job protocol.Job
		var saveErr error
		if id == "" {
			job, saveErr = api.CreateJob(ctx, input)
		} else {
			job, saveErr = api.UpdateJob(ctx, id, input)
		}
		if ctx.Err() != nil {
			return
		}
		window.Update(func() {
			if a.stale(generation) || a.user == nil {
				return
			}
			a.savingJob = false
			if client.IsUnauthorized(saveErr) {
				a.expireSession("Your session expired. Sign in again.")
				return
			}
			if saveErr != nil {
				a.form.err = saveErr.Error()
				return
			}
			found := false
			for i := range a.jobs {
				if a.jobs[i].ID == job.ID {
					a.jobs[i], found = job, true
					break
				}
			}
			if !found {
				a.jobs = append(a.jobs, job)
			}
			a.selectedID = job.ID
			a.form = jobForm{}
		})
	}()
}

func (a *App) pageTitle() string {
	switch a.page {
	case pageJobs:
		return "Jobs"
	case pageMetrics:
		return "Live metrics"
	default:
		return "Overview"
	}
}

func (a *App) pageDescription() string {
	switch a.page {
	case pageJobs:
		return "Create, review, and update work across your workspace."
	case pageMetrics:
		return "A live view of activity from the authenticated demo API."
	default:
		return "A calm view of what is running across your workspace."
	}
}

func (a *App) route(to page) {
	a.page = to
	switch to {
	case pageOverview, pageJobs:
		a.operationsOpen = true
	case pageMetrics:
		a.observeOpen = true
	}
	if to != pageJobs {
		a.form = jobForm{}
	}
}
