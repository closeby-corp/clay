package app

import (
	"context"
	"net/http"
	"strings"
	"testing"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/client"
	"github.com/closeby-corp/clay/prototypes/mygo/internal/protocol"
	"github.com/egoist/mygo/ui"
)

func signedInApp() *App {
	a := New(nil)
	a.loadingUser = false
	a.user = &protocol.User{Name: "Alice Chen", Role: "Operator"}
	a.jobs = []protocol.Job{
		{ID: "job-1", Name: "Batch export", Priority: 3, Status: "running"},
		{ID: "job-2", Name: "Nightly warehouse sync", Priority: 5, Status: "queued"},
	}
	return a
}

func TestNavigationSelectsAndEditsJob(t *testing.T) {
	a := signedInApp()
	a.page = pageMetrics
	a.observeOpen = true
	a.operationsOpen = false
	tester := ui.NewTester(a.View, 1160, 820)
	if !tester.HasText("Alice Chen") {
		t.Fatal("signed-in user is not shown")
	}
	if tester.HasText("Jobs") {
		t.Fatal("collapsed Operations branch still shows its children")
	}
	if err := tester.Click("Operations"); err != nil {
		t.Fatal(err)
	}
	if !a.operationsOpen || !tester.HasText("Jobs") {
		t.Fatal("Operations branch did not expand")
	}

	if err := tester.Click("Jobs"); err != nil {
		t.Fatal(err)
	}
	if a.page != pageJobs {
		t.Fatalf("page = %q, want %q", a.page, pageJobs)
	}
	if err := tester.Click("Batch export"); err != nil {
		t.Fatal(err)
	}
	if a.selectedID != "job-1" {
		t.Fatalf("selectedID = %q, want job-1", a.selectedID)
	}
	if err := tester.Click("Edit selected"); err != nil {
		t.Fatal(err)
	}
	if !a.form.open || a.form.id != "job-1" || a.form.name != "Batch export" {
		t.Fatalf("edit form = %+v, want selected job values", a.form)
	}
}

func TestNavigationActivatesLeafWithKeyboard(t *testing.T) {
	a := signedInApp()
	a.operationsOpen = false
	tester := ui.NewTester(a.View, 1160, 820)
	if err := tester.Click("Operations"); err != nil {
		t.Fatal(err)
	}
	tester.Key(0, ui.KeyRight)
	tester.Key(0, ui.KeyDown)
	tester.Key(0, ui.KeyEnter)
	if a.page != pageJobs {
		t.Fatalf("keyboard navigation page = %q, want %q", a.page, pageJobs)
	}
}

func TestCompactNavigationRoutesAtNarrowWidth(t *testing.T) {
	a := signedInApp()
	tester := ui.NewTester(a.View, 420, 780)
	if !tester.HasText("Jobs") {
		t.Fatal("compact navigation does not show Jobs")
	}
	if err := tester.Click("Metrics"); err != nil {
		t.Fatal(err)
	}
	if a.page != pageMetrics {
		t.Fatalf("page = %q, want %q", a.page, pageMetrics)
	}
}

func TestSelectedJobToolbarFitsNarrowWindow(t *testing.T) {
	a := signedInApp()
	a.page = pageJobs
	a.selectedID = "job-1"
	tester := ui.NewTester(a.View, 390, 844)

	heading, ok := tester.Find("Workspace jobs")
	if !ok || heading.H > 40 {
		t.Fatalf("Workspace jobs heading bounds = %+v, found=%v; want a single-line visible heading", heading, ok)
	}
	for _, label := range []string{"Edit selected", "Refresh jobs", "New job"} {
		bounds, ok := tester.Find(label)
		if !ok || bounds.W < 60 || bounds.H < 30 || bounds.X < 0 || bounds.Y < 0 || bounds.X+bounds.W > 390 || bounds.Y+bounds.H > 844 {
			t.Errorf("toolbar control %q bounds = %+v, found=%v; want a usable on-screen target", label, bounds, ok)
		}
	}
}

func TestRouteOpensActiveNavigationAncestor(t *testing.T) {
	a := signedInApp()
	a.operationsOpen, a.observeOpen = false, false
	a.route(pageJobs)
	if !a.operationsOpen {
		t.Fatal("routing to Jobs left Operations collapsed")
	}
	a.operationsOpen, a.observeOpen = false, false
	a.route(pageMetrics)
	if !a.observeOpen {
		t.Fatal("routing to Live metrics left Observe collapsed")
	}
}

func TestJobFormAcceptsKeyboardInputAndValidates(t *testing.T) {
	a := signedInApp()
	a.page = pageJobs
	a.form = jobForm{open: true, priority: 3, status: "queued"}
	tester := ui.NewTester(a.View, 940, 760)

	if err := tester.Click("Job name"); err != nil {
		t.Fatal(err)
	}
	tester.Type("   ")
	tester.Key(0, ui.KeyEnter)
	if a.form.err != "Enter a job name." {
		t.Fatalf("form error = %q, want required-name validation", a.form.err)
	}
	tester.Type("Event export")
	tester.Key(0, ui.KeyEnter)
	if a.form.name != "   Event export" || a.form.err != "" {
		t.Fatalf("keyboard edit name=%q error=%q", a.form.name, a.form.err)
	}

	a.form.priority = 6
	tester.Frame()
	if err := tester.Click("Create job"); err != nil {
		t.Fatal(err)
	}
	if a.form.err != "Choose a priority from 1 to 5." {
		t.Fatalf("form error = %q, want priority validation", a.form.err)
	}
}

func TestValidateJobTrimsAndChecksFields(t *testing.T) {
	input, err := validateJob("  Rebuild index  ", 4, "paused")
	if err != nil || input.Name != "Rebuild index" || input.Priority != 4 || input.Status != "paused" {
		t.Fatalf("validateJob() = %+v, %v", input, err)
	}
	for _, test := range []struct {
		name     string
		priority int
		status   string
		want     string
	}{
		{" ", 2, "queued", "Enter a job name."},
		{"Valid", 0, "queued", "Choose a priority from 1 to 5."},
		{"Valid", 6, "queued", "Choose a priority from 1 to 5."},
		{"Valid", 5, "failed", "Choose queued, running, or paused."},
	} {
		_, err := validateJob(test.name, test.priority, test.status)
		if err == nil || err.Error() != test.want {
			t.Errorf("validateJob(%q, %d, %q) error = %v, want %q", test.name, test.priority, test.status, err, test.want)
		}
	}
}

func TestValidateJobNameRuneLimit(t *testing.T) {
	name := strings.Repeat("界", 120)
	input, err := validateJob("  "+name+"  ", 1, "queued")
	if err != nil || input.Name != name {
		t.Fatalf("120-rune name = %+v, %v; want trimmed name accepted", input, err)
	}
	if _, err := validateJob(name+"界", 5, "paused"); err == nil || err.Error() != "Job name must be 120 characters or fewer." {
		t.Fatalf("121-rune name error = %v, want length validation", err)
	}
}

func TestNewSessionContextClearsCancelledWork(t *testing.T) {
	a := New(nil)
	defer a.Close()

	oldCtx, oldCancel := context.WithCancel(a.rootCtx)
	a.sessionCtx, a.cancel = oldCtx, oldCancel
	a.loadingUser, a.loginBusy, a.logoutBusy = true, true, true
	a.jobsLoading, a.savingJob = true, true

	previousGeneration := a.generation
	if _, generation := a.newSessionContext(); generation != previousGeneration+1 {
		t.Fatalf("new session generation = %d, want %d", generation, previousGeneration+1)
	}
	if oldCtx.Err() != context.Canceled {
		t.Fatal("previous session context was not cancelled")
	}
	if a.loadingUser || a.loginBusy || a.logoutBusy || a.jobsLoading || a.savingJob {
		t.Fatalf("cancelled session flags were retained: loadingUser=%v loginBusy=%v logoutBusy=%v jobsLoading=%v savingJob=%v",
			a.loadingUser, a.loginBusy, a.logoutBusy, a.jobsLoading, a.savingJob)
	}
}

func TestUnauthorizedLogoutReturnsToLogin(t *testing.T) {
	a := signedInApp()
	a.logoutBusy, a.savingJob, a.jobsLoading = true, true, true
	a.finishLogout(&client.HTTPError{Status: http.StatusUnauthorized})

	if a.user != nil || a.logoutBusy || a.savingJob || a.jobsLoading {
		t.Fatalf("unauthorized logout retained session state: user=%+v logoutBusy=%v savingJob=%v jobsLoading=%v",
			a.user, a.logoutBusy, a.savingJob, a.jobsLoading)
	}
	if a.loginError != "Your session expired. Sign in again." {
		t.Fatalf("login error = %q, want expired-session message", a.loginError)
	}
	tester := ui.NewTester(a.View, 1160, 820)
	if !tester.HasText("Welcome back") || tester.HasText("Alice Chen") {
		t.Fatal("unauthorized logout did not return the window to the login view")
	}
}
