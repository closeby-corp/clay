package uploadsapp

import (
	"context"
	"errors"
	"strings"
	"sync/atomic"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/client"
	"github.com/closeby-corp/clay/prototypes/mygo/internal/protocol"
	"github.com/egoist/mygo"
)

type API interface {
	Login(context.Context, string, string) (protocol.User, error)
	Session(context.Context) (protocol.User, error)
	Logout(context.Context) error
	client.Uploads
}

type App struct {
	api      API
	window   *mygo.Window
	dispatch func(func())

	rootCtx    context.Context
	rootCancel context.CancelFunc
	sessionCtx context.Context
	cancel     context.CancelFunc
	generation uint64
	workID     uint64
	listID     uint64
	workCancel context.CancelFunc
	closed     atomic.Bool

	loadingUser bool
	loginBusy   bool
	logoutBusy  bool
	loginError  string
	username    string
	password    string
	user        *protocol.User

	files           []protocol.UploadedFile
	lifetimeUploads int64
	loadingFiles    bool
	selectingFiles  bool
	workflowError   string
	notice          string
	selectedID      string
	busy            bool
	busyLabel       string
	canCancel       bool
	deleteConfirm   bool
	filePicker      func(*mygo.Window, func([]LocalFile, error))
}

func New(api API) *App {
	ctx, cancel := context.WithCancel(context.Background())
	return &App{api: api, rootCtx: ctx, rootCancel: cancel, loadingUser: true, filePicker: pickFiles}
}

func NewWindowID() string { return newWindowID() }

func (a *App) Start(window *mygo.Window) {
	a.window = window
	ctx, generation := a.newSessionContext()
	a.loadingUser = true
	go func() {
		user, err := a.api.Session(ctx)
		if ctx.Err() != nil {
			return
		}
		a.update(func() {
			if a.stale(generation) {
				return
			}
			a.loadingUser = false
			switch {
			case client.IsUnauthorized(err):
				a.user = nil
			case err != nil:
				a.loginError = "Could not reach the uploads service: " + err.Error()
			default:
				a.authenticated(generation, user)
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
	if a.workCancel != nil {
		a.workCancel()
	}
	a.rootCancel()
}

func (a *App) update(fn func()) {
	if a.window != nil {
		a.window.Update(fn)
		return
	}
	if a.dispatch != nil {
		a.dispatch(fn)
		return
	}
	fn()
}

func (a *App) newSessionContext() (context.Context, uint64) {
	if a.cancel != nil {
		a.cancel()
	}
	if a.workCancel != nil {
		a.workCancel()
	}
	a.resetSessionWork()
	ctx, cancel := context.WithCancel(a.rootCtx)
	a.sessionCtx, a.cancel = ctx, cancel
	a.generation++
	a.clearUserData()
	return ctx, a.generation
}

func (a *App) resetSessionWork() {
	a.loadingUser, a.loadingFiles = false, false
	a.selectingFiles = false
	a.loginBusy, a.logoutBusy = false, false
	a.busy, a.canCancel = false, false
	a.busyLabel = ""
	a.workCancel = nil
	a.workID++
	a.listID++
}

func (a *App) clearUserData() {
	a.user = nil
	a.files = nil
	a.lifetimeUploads = 0
	a.selectedID = ""
	a.workflowError = ""
	a.notice = ""
	a.deleteConfirm = false
}

func (a *App) stale(generation uint64) bool {
	return a.closed.Load() || generation != a.generation
}

func (a *App) authenticated(generation uint64, user protocol.User) {
	if a.stale(generation) {
		return
	}
	a.user = &user
	a.loginError = ""
	a.username, a.password = "", ""
	a.clearUserUploads()
	a.refreshUploads()
}

func (a *App) clearUserUploads() {
	a.files = nil
	a.lifetimeUploads = 0
	a.selectedID = ""
	a.loadingFiles = false
	a.workflowError = ""
	a.notice = ""
}

func (a *App) login() {
	if a.loginBusy || a.logoutBusy || a.api == nil {
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
	api, password := a.api, a.password
	go func() {
		user, err := api.Login(ctx, username, password)
		if ctx.Err() != nil {
			return
		}
		a.update(func() {
			if a.stale(generation) {
				return
			}
			a.loginBusy = false
			if err != nil {
				a.loginError = err.Error()
				return
			}
			a.authenticated(generation, user)
		})
	}()
}

func (a *App) logout() {
	if a.logoutBusy || a.user == nil || a.api == nil {
		return
	}
	if a.cancel != nil {
		a.cancel()
	}
	if a.workCancel != nil {
		a.workCancel()
	}
	a.sessionCtx, a.cancel = nil, nil
	a.generation++
	a.resetSessionWork()
	a.clearUserData()
	a.logoutBusy = true
	generation, api, ctx := a.generation, a.api, a.rootCtx
	go func() {
		err := api.Logout(ctx)
		if ctx.Err() != nil {
			return
		}
		a.update(func() {
			if a.stale(generation) {
				return
			}
			a.logoutBusy = false
			if client.IsUnauthorized(err) {
				a.loginError = "Your session expired. Sign in again."
			} else if err != nil {
				a.loginError = "Could not sign out: " + err.Error()
			}
		})
	}()
}

func (a *App) expireSession(message string) {
	if a.cancel != nil {
		a.cancel()
	}
	if a.workCancel != nil {
		a.workCancel()
	}
	a.sessionCtx, a.cancel = nil, nil
	a.generation++
	a.resetSessionWork()
	a.clearUserData()
	a.loginError = message
}

func (a *App) refreshUploads() {
	if a.sessionCtx == nil || a.user == nil || a.api == nil {
		return
	}
	a.workflowError = ""
	a.loadingFiles = true
	a.listID++
	requestID, generation, ctx, api := a.listID, a.generation, a.sessionCtx, a.api
	go func() {
		list, err := api.ListUploads(ctx)
		if ctx.Err() != nil {
			return
		}
		a.update(func() {
			if a.stale(generation) || a.user == nil || requestID != a.listID {
				return
			}
			a.loadingFiles = false
			if client.IsUnauthorized(err) {
				a.expireSession("Your session expired. Sign in again.")
				return
			}
			if err != nil {
				a.workflowError = err.Error()
				return
			}
			a.applyList(list)
		})
	}()
}

func (a *App) applyList(list protocol.UploadList) {
	a.files = list.Files
	a.lifetimeUploads = list.LifetimeUploads
	if !a.hasFile(a.selectedID) {
		a.selectedID = ""
		if len(a.files) > 0 {
			a.selectedID = a.files[0].ID
		}
	}
}

func (a *App) hasFile(id string) bool {
	for i := range a.files {
		if a.files[i].ID == id {
			return true
		}
	}
	return false
}

func (a *App) selectedFile() *protocol.UploadedFile {
	for i := range a.files {
		if a.files[i].ID == a.selectedID {
			return &a.files[i]
		}
	}
	return nil
}

func (a *App) chooseFiles() {
	if a.user == nil || a.busy || a.selectingFiles || a.window == nil {
		return
	}
	generation, window := a.generation, a.window
	a.selectingFiles = true
	a.filePicker(window, func(files []LocalFile, err error) {
		if a.closed.Load() {
			return
		}
		a.update(func() {
			if a.stale(generation) || a.user == nil {
				return
			}
			a.selectingFiles = false
			if err != nil {
				a.workflowError = err.Error()
				return
			}
			if len(files) > 0 {
				a.upload(files)
			}
		})
	})
}

func (a *App) upload(files []LocalFile) {
	input, err := uploadInputs(files)
	if err != nil {
		a.workflowError = err.Error()
		return
	}
	ctx, generation, workID, cancel, ok := a.beginWork("Uploading files", true)
	if !ok {
		return
	}
	api, count := a.api, len(input)
	go func() {
		list, err := api.UploadFiles(ctx, input)
		if ctx.Err() != nil {
			return
		}
		a.update(func() {
			if !a.finishWork(generation, workID, cancel) {
				return
			}
			if client.IsUnauthorized(err) {
				a.expireSession("Your session expired. Sign in again.")
				return
			}
			if err != nil {
				a.workflowError = err.Error()
				return
			}
			a.workflowError = ""
			a.notice = uploadedMessage(count)
			a.listID++
			a.applyList(list)
		})
	}()
}

func uploadedMessage(count int) string {
	if count == 1 {
		return "File uploaded."
	}
	return "Files uploaded."
}

func (a *App) beginWork(label string, canCancel bool) (context.Context, uint64, uint64, context.CancelFunc, bool) {
	if a.user == nil || a.sessionCtx == nil || a.api == nil || a.busy {
		return nil, 0, 0, nil, false
	}
	ctx, cancel := context.WithCancel(a.sessionCtx)
	a.workID++
	a.workCancel = cancel
	a.busy, a.canCancel, a.busyLabel = true, canCancel, label
	a.notice, a.workflowError = "", ""
	return ctx, a.generation, a.workID, cancel, true
}

func (a *App) finishWork(generation, workID uint64, cancel context.CancelFunc) bool {
	if a.stale(generation) || a.user == nil || workID != a.workID {
		return false
	}
	if cancel != nil {
		cancel()
	}
	a.workCancel = nil
	a.busy, a.canCancel, a.busyLabel = false, false, ""
	return true
}

func (a *App) cancelTransfer() {
	if !a.busy || !a.canCancel || a.workCancel == nil {
		return
	}
	a.workCancel()
	a.workCancel = nil
	a.workID++
	a.busy, a.canCancel, a.busyLabel = false, false, ""
	a.notice = "Transfer cancelled."
	a.refreshUploads()
}

func (a *App) downloadSelected() {
	file := a.selectedFile()
	if file == nil {
		return
	}
	ctx, generation, workID, cancel, ok := a.beginWork("Preparing download", false)
	if !ok {
		return
	}
	api, window, id, name, contentType := a.api, a.window, file.ID, file.Name, file.Type
	go func() {
		data, err := api.DownloadUpload(ctx, id)
		if ctx.Err() != nil {
			return
		}
		if err != nil {
			a.update(func() {
				if !a.finishWork(generation, workID, cancel) {
					return
				}
				a.actionError(err)
			})
			return
		}
		saveDownload(ctx, window, name, contentType, data, func(err error) {
			if ctx.Err() != nil {
				return
			}
			a.update(func() {
				if !a.finishWork(generation, workID, cancel) {
					return
				}
				if err != nil {
					if errors.Is(err, errSaveCanceled) {
						return
					}
					a.workflowError = err.Error()
				} else {
					a.notice = "Download ready."
				}
			})
		})
	}()
}

func (a *App) copySelectedName() {
	file := a.selectedFile()
	if file == nil {
		return
	}
	generation, name := a.generation, file.Name
	copyName(name, func(err error) {
		if a.closed.Load() {
			return
		}
		a.update(func() {
			if a.stale(generation) || a.user == nil {
				return
			}
			if err != nil {
				a.workflowError = err.Error()
			} else {
				a.workflowError = ""
				a.notice = "File name copied."
			}
		})
	})
}

func (a *App) deleteSelected() {
	file := a.selectedFile()
	if file == nil {
		return
	}
	id := file.ID
	ctx, generation, workID, cancel, ok := a.beginWork("Deleting file", false)
	if !ok {
		return
	}
	api := a.api
	go func() {
		deleteErr := api.DeleteUpload(ctx, id)
		if ctx.Err() != nil {
			return
		}
		var list protocol.UploadList
		var listErr error
		if deleteErr == nil {
			list, listErr = api.ListUploads(ctx)
		}
		if ctx.Err() != nil {
			return
		}
		a.update(func() {
			if !a.finishWork(generation, workID, cancel) {
				return
			}
			if client.IsUnauthorized(deleteErr) || client.IsUnauthorized(listErr) {
				a.expireSession("Your session expired. Sign in again.")
				return
			}
			if deleteErr != nil {
				a.workflowError = deleteErr.Error()
				return
			}
			a.workflowError = ""
			a.notice = "Uploaded copy deleted."
			a.listID++
			if listErr != nil {
				a.removeDeleted(id)
				a.workflowError = "Deleted the file, but could not refresh the list: " + listErr.Error()
				return
			}
			a.applyList(list)
		})
	}()
}

func (a *App) removeDeleted(id string) {
	for i := range a.files {
		if a.files[i].ID == id {
			a.files = append(a.files[:i], a.files[i+1:]...)
			break
		}
	}
	if a.selectedID == id {
		a.selectedID = ""
		if len(a.files) > 0 {
			a.selectedID = a.files[0].ID
		}
	}
}

func (a *App) actionError(err error) {
	if client.IsUnauthorized(err) {
		a.expireSession("Your session expired. Sign in again.")
		return
	}
	a.workflowError = err.Error()
}

func (a *App) selectedAt(id string) {
	if a.hasFile(id) && !a.busy {
		a.selectedID = id
		a.notice, a.workflowError = "", ""
	}
}
