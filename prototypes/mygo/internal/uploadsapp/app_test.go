package uploadsapp

import (
	"context"
	"errors"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/client"
	"github.com/closeby-corp/clay/prototypes/mygo/internal/protocol"
	"github.com/egoist/mygo"
	"github.com/egoist/mygo/ui"
)

type testAPI struct {
	mu sync.Mutex

	files    []protocol.UploadedFile
	lifetime int64
	deletes  int
	active   int
	idle     chan struct{}

	uploadStarted chan struct{}
	uploadDone    chan struct{}
	listStarted   chan struct{}
	listDone      chan struct{}
	listGate      <-chan struct{}
}

func (api *testAPI) beginCall() {
	api.mu.Lock()
	if api.active == 0 {
		api.idle = make(chan struct{})
	}
	api.active++
	api.mu.Unlock()
}

func (api *testAPI) endCall() {
	api.mu.Lock()
	api.active--
	if api.active == 0 {
		close(api.idle)
	}
	api.mu.Unlock()
}

func (api *testAPI) waitIdle(t *testing.T) {
	t.Helper()
	api.mu.Lock()
	idle := api.idle
	if api.active == 0 && idle == nil {
		idle = make(chan struct{})
		close(idle)
		api.idle = idle
	}
	api.mu.Unlock()
	select {
	case <-idle:
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for fake API calls to finish")
	}
}

func (api *testAPI) snapshot() protocol.UploadList {
	api.mu.Lock()
	defer api.mu.Unlock()
	return protocol.UploadList{Files: append([]protocol.UploadedFile(nil), api.files...), LifetimeUploads: api.lifetime}
}

func (api *testAPI) deleteCount() int {
	api.mu.Lock()
	defer api.mu.Unlock()
	return api.deletes
}

func (api *testAPI) setListHooks(started, done chan struct{}, gate <-chan struct{}) {
	api.mu.Lock()
	api.listStarted, api.listDone, api.listGate = started, done, gate
	api.mu.Unlock()
}

func (api *testAPI) Login(context.Context, string, string) (protocol.User, error) {
	api.beginCall()
	defer api.endCall()
	return protocol.User{ID: "alice", Name: "Alice Chen", Role: "Operator"}, nil
}
func (api *testAPI) Session(context.Context) (protocol.User, error) {
	api.beginCall()
	defer api.endCall()
	return protocol.User{}, &client.HTTPError{Status: 401}
}
func (api *testAPI) Logout(context.Context) error {
	api.beginCall()
	defer api.endCall()
	return nil
}
func (api *testAPI) ListUploads(ctx context.Context) (protocol.UploadList, error) {
	api.beginCall()
	defer api.endCall()
	api.mu.Lock()
	started, done, gate := api.listStarted, api.listDone, api.listGate
	api.mu.Unlock()
	if done != nil {
		defer close(done)
	}
	if started != nil {
		select {
		case started <- struct{}{}:
		default:
		}
	}
	if gate != nil {
		select {
		case <-gate:
		case <-ctx.Done():
			return protocol.UploadList{}, ctx.Err()
		}
	}
	api.mu.Lock()
	list := protocol.UploadList{Files: append([]protocol.UploadedFile(nil), api.files...), LifetimeUploads: api.lifetime}
	api.mu.Unlock()
	return list, nil
}
func (api *testAPI) UploadFiles(ctx context.Context, _ []client.UploadFile) (protocol.UploadList, error) {
	api.beginCall()
	defer api.endCall()
	if api.uploadDone != nil {
		defer close(api.uploadDone)
	}
	if api.uploadStarted != nil {
		api.uploadStarted <- struct{}{}
	}
	<-ctx.Done()
	return protocol.UploadList{}, ctx.Err()
}
func (api *testAPI) DownloadUpload(context.Context, string) ([]byte, error) {
	api.beginCall()
	defer api.endCall()
	return []byte("contents"), nil
}
func (api *testAPI) DeleteUpload(_ context.Context, id string) error {
	api.beginCall()
	defer api.endCall()
	api.mu.Lock()
	defer api.mu.Unlock()
	api.deletes++
	for i := range api.files {
		if api.files[i].ID == id {
			api.files = append(api.files[:i], api.files[i+1:]...)
			return nil
		}
	}
	return errors.New("file not found")
}

type testDispatcher struct {
	mu      sync.Mutex
	queued  []func()
	changed chan struct{}
}

func newTestDispatcher() *testDispatcher {
	return &testDispatcher{changed: make(chan struct{}, 1)}
}

func (d *testDispatcher) post(fn func()) {
	d.mu.Lock()
	d.queued = append(d.queued, fn)
	d.mu.Unlock()
	select {
	case d.changed <- struct{}{}:
	default:
	}
}

func (d *testDispatcher) drain() {
	d.mu.Lock()
	queued := d.queued
	d.queued = nil
	d.mu.Unlock()
	for _, fn := range queued {
		fn()
	}
}

func (d *testDispatcher) hasPending() bool {
	d.mu.Lock()
	defer d.mu.Unlock()
	return len(d.queued) > 0
}

func (d *testDispatcher) waitPending(t *testing.T) {
	t.Helper()
	timer := time.NewTimer(2 * time.Second)
	defer timer.Stop()
	for !d.hasPending() {
		select {
		case <-d.changed:
		case <-timer.C:
			t.Fatal("timed out waiting for queued app update")
		}
	}
}

func newTestApp(api *testAPI) (*App, *testDispatcher) {
	a, dispatcher := New(api), newTestDispatcher()
	a.dispatch = dispatcher.post
	return a, dispatcher
}

func cleanupTestApp(t *testing.T, a *App, dispatcher *testDispatcher, api *testAPI) {
	t.Helper()
	a.Close()
	api.waitCalls(t)
	dispatcher.drain()
}

func (api *testAPI) waitCalls(t *testing.T) {
	t.Helper()
	api.mu.Lock()
	uploadDone, listDone := api.uploadDone, api.listDone
	api.mu.Unlock()
	if uploadDone != nil {
		waitSignal(t, uploadDone, "upload API call did not finish during teardown")
	}
	if listDone != nil {
		waitSignal(t, listDone, "list API call did not finish during teardown")
	}
	api.waitIdle(t)
}

func TestLoginListsSelectsAndConfirmsDelete(t *testing.T) {
	api := &testAPI{
		lifetime: 3,
		files: []protocol.UploadedFile{
			{ID: "one", Name: "notes.txt", Size: 12, Type: "text/plain", UploadedAt: "2026-10-21T12:00:00Z"},
			{ID: "two", Name: "chart.png", Size: 1024, Type: "image/png", UploadedAt: "2026-10-21T12:05:00Z"},
		},
	}
	a, dispatcher := newTestApp(api)
	a.loadingUser = false
	t.Cleanup(func() { cleanupTestApp(t, a, dispatcher, api) })
	tester := ui.NewTester(a.View, 960, 740)
	if err := tester.Click("Username"); err != nil {
		t.Fatal(err)
	}
	tester.Type("alice")
	if err := tester.Click("Password"); err != nil {
		t.Fatal(err)
	}
	tester.Type("demo-alice")
	if err := tester.Click("Sign in"); err != nil {
		t.Fatal(err)
	}
	waitFor(t, dispatcher, func() bool { return a.user != nil && !a.loadingFiles })
	tester.Frame()
	if a.user.Name != "Alice Chen" || len(a.files) != 2 || a.lifetimeUploads != 3 {
		t.Fatalf("logged-in state = user %+v files %+v lifetime %d", a.user, a.files, a.lifetimeUploads)
	}
	if !tester.HasText("Files in this window") || !tester.HasText("Lifetime uploads") || !tester.HasText("chart.png") {
		t.Fatal("real upload list, window scope, or lifetime counter is not visible")
	}
	if err := tester.Click("chart.png"); err != nil {
		t.Fatal(err)
	}
	if a.selectedID != "two" || !tester.HasText("image/png") {
		t.Fatalf("selected file = %q, view has type=%v", a.selectedID, tester.HasText("image/png"))
	}
	if err := tester.Click("Delete"); err != nil {
		t.Fatal(err)
	}
	if !a.deleteConfirm {
		t.Fatal("Delete did not ask for confirmation")
	}
	if err := tester.Click("Keep file"); err != nil {
		t.Fatal(err)
	}
	if a.deleteConfirm || api.deleteCount() != 0 {
		t.Fatal("canceling delete changed the uploaded file")
	}
	if err := tester.Click("Delete"); err != nil {
		t.Fatal(err)
	}
	if err := tester.Click("Delete file"); err != nil {
		t.Fatal(err)
	}
	waitFor(t, dispatcher, func() bool { return api.deleteCount() == 1 && len(a.files) == 1 && !a.busy })
	tester.Frame()
	if a.files[0].ID != "one" || a.lifetimeUploads != 3 || tester.HasText("chart.png") {
		t.Fatalf("post-delete files=%+v lifetime=%d", a.files, a.lifetimeUploads)
	}
}

func TestCancelUploadAndIgnoreOldSessionList(t *testing.T) {
	api := &testAPI{
		lifetime:      5,
		files:         []protocol.UploadedFile{{ID: "old", Name: "old.txt"}},
		uploadStarted: make(chan struct{}, 1),
		uploadDone:    make(chan struct{}),
	}
	a, dispatcher := newTestApp(api)
	t.Cleanup(func() { cleanupTestApp(t, a, dispatcher, api) })
	a.sessionCtx, _ = a.newSessionContext()
	a.user = &protocol.User{ID: "alice", Name: "Alice Chen"}
	a.applyList(api.snapshot())
	tester := ui.NewTester(a.View, 860, 700)
	a.upload([]LocalFile{{Name: "new.txt", Type: "text/plain", Data: []byte("new")}})
	select {
	case <-api.uploadStarted:
	case <-time.After(time.Second):
		t.Fatal("upload did not start")
	}
	tester.Frame()
	if !a.busy || !a.canCancel || !tester.HasText("Cancel transfer") {
		t.Fatal("upload busy/cancel state was not shown")
	}
	if err := tester.Click("Cancel transfer"); err != nil {
		t.Fatal(err)
	}
	waitFor(t, dispatcher, func() bool { return !a.busy && !a.loadingFiles })
	waitSignal(t, api.uploadDone, "cancelled upload did not finish")
	if a.notice != "Transfer cancelled." {
		t.Fatalf("cancel notice = %q", a.notice)
	}

	gate := make(chan struct{})
	started := make(chan struct{}, 1)
	listDone := make(chan struct{})
	api.setListHooks(started, listDone, gate)
	a.refreshUploads()
	waitSignal(t, started, "old-session list did not start")
	oldFiles := append([]protocol.UploadedFile(nil), a.files...)
	close(gate)
	dispatcher.waitPending(t)
	newCtx, _ := a.newSessionContext()
	a.sessionCtx = newCtx
	a.user = &protocol.User{ID: "bob", Name: "Bob Rivera"}
	if len(a.files) != 0 || a.lifetimeUploads != 0 || a.busy || a.loadingFiles {
		t.Fatalf("session reset retained old uploads: files=%+v lifetime=%d busy=%v loading=%v", a.files, a.lifetimeUploads, a.busy, a.loadingFiles)
	}
	dispatcher.drain()
	tester.Frame()
	if len(a.files) != 0 || a.lifetimeUploads != 0 || len(oldFiles) != 1 {
		t.Fatalf("stale response repopulated new user state: files=%+v lifetime=%d", a.files, a.lifetimeUploads)
	}
}

func TestChooseFilesReservesPickerUntilCallbackAndSessionReset(t *testing.T) {
	api := &testAPI{}
	a, dispatcher := newTestApp(api)
	a.user = &protocol.User{ID: "alice", Name: "Alice Chen"}
	a.window = &mygo.Window{}
	var finish func([]LocalFile, error)
	pickerCalls := 0
	a.filePicker = func(_ *mygo.Window, done func([]LocalFile, error)) {
		pickerCalls++
		finish = done
	}
	t.Cleanup(func() { cleanupTestApp(t, a, dispatcher, api) })

	a.chooseFiles()
	if !a.selectingFiles || pickerCalls != 1 {
		t.Fatalf("picker start: selecting=%v calls=%d", a.selectingFiles, pickerCalls)
	}
	tester := ui.NewTester(a.View, 960, 740)
	tester.Frame()
	if !tester.HasText("up to 10 files") {
		t.Fatal("upload guidance does not show the file-count limit")
	}
	a.chooseFiles()
	if pickerCalls != 1 {
		t.Fatalf("overlapping picker started: calls=%d", pickerCalls)
	}
	a.window = nil   // route completion through the test dispatcher
	finish(nil, nil) // cancellation
	waitFor(t, dispatcher, func() bool { return !a.selectingFiles })

	a.window = &mygo.Window{}
	a.chooseFiles()
	if pickerCalls != 2 || !a.selectingFiles {
		t.Fatalf("picker did not restart after cancellation: selecting=%v calls=%d", a.selectingFiles, pickerCalls)
	}
	a.newSessionContext()
	if a.selectingFiles {
		t.Fatal("session reset left the picker reserved")
	}
	a.window = nil
	finish(nil, nil) // stale callback from the previous session
	dispatcher.drain()
	if a.selectingFiles {
		t.Fatal("stale picker callback changed the new session")
	}

	if _, err := uploadInputs(make([]LocalFile, client.MaxUploadFiles+1)); err == nil || !strings.Contains(err.Error(), "up to") {
		t.Fatalf("uploadInputs accepted more than %d files: %v", client.MaxUploadFiles, err)
	}
}

func TestUploadInputsAcceptsImagesAndWorkflowFormats(t *testing.T) {
	files, err := uploadInputs([]LocalFile{
		{Name: "photo.png", Type: "image/png", Data: []byte{0x89, 'P', 'N', 'G'}},
		{Name: "notes.md", Data: []byte("# notes")},
		{Name: "report.csv", Type: "text/csv", Data: []byte("a,b\n1,2")},
	})
	if err != nil || len(files) != 3 || files[1].Name != "notes.md" {
		t.Fatalf("uploadInputs() = %+v, %v", files, err)
	}
	for _, file := range []LocalFile{
		{Name: "program.exe", Type: "application/octet-stream"},
		{Name: "too-large.txt", Data: make([]byte, client.MaxUploadSize+1)},
		{Name: "../outside.txt", Data: []byte("outside")},
	} {
		if _, err := uploadInputs([]LocalFile{file}); err == nil {
			t.Errorf("uploadInputs(%q) accepted invalid file", file.Name)
		}
	}
}

func waitFor(t *testing.T, dispatcher *testDispatcher, ready func() bool) {
	t.Helper()
	timer := time.NewTimer(2 * time.Second)
	defer timer.Stop()
	for {
		dispatcher.drain()
		if ready() {
			return
		}
		select {
		case <-dispatcher.changed:
		case <-timer.C:
			dispatcher.drain()
			if ready() {
				return
			}
			t.Fatal("timed out waiting for app state")
		}
	}
}

func waitSignal(t *testing.T, signal <-chan struct{}, message string) {
	t.Helper()
	select {
	case <-signal:
	case <-time.After(2 * time.Second):
		t.Fatal(message)
	}
}
