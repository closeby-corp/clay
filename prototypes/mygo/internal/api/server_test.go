package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/protocol"
)

func TestHealthAndAnonymousDenial(t *testing.T) {
	server := newServer(time.Hour)
	health := httptest.NewRecorder()
	server.ServeHTTP(health, httptest.NewRequest(http.MethodGet, "/api/health", nil))
	if health.Code != http.StatusOK || !strings.Contains(health.Body.String(), `"status":"ok"`) {
		t.Fatalf("health = %d %s", health.Code, health.Body.String())
	}

	for _, path := range []string{"/api/session", "/api/jobs", "/api/events"} {
		t.Run(path, func(t *testing.T) {
			response := httptest.NewRecorder()
			server.ServeHTTP(response, httptest.NewRequest(http.MethodGet, path, nil))
			assertError(t, response, http.StatusUnauthorized)
		})
	}
}

func TestLoginSessionLogout(t *testing.T) {
	server := newServer(time.Hour)
	loginResponse, cookie := loginAs(t, server, "alice", "demo-alice")
	if loginResponse.Code != http.StatusOK {
		t.Fatalf("login = %d %s", loginResponse.Code, loginResponse.Body.String())
	}
	var user protocol.User
	if err := json.Unmarshal(loginResponse.Body.Bytes(), &user); err != nil {
		t.Fatal(err)
	}
	if user.ID != "alice" || user.Name != "Alice" || user.Role != "user" {
		t.Fatalf("login user = %+v", user)
	}
	if !cookie.HttpOnly || cookie.SameSite != http.SameSiteLaxMode || cookie.Path != "/" || len(cookie.Value) < 40 {
		t.Fatalf("session cookie missing expected protections: %+v", cookie)
	}

	sessionResponse := request(server, http.MethodGet, "/api/session", nil, cookie)
	if sessionResponse.Code != http.StatusOK || !strings.Contains(sessionResponse.Body.String(), `"name":"Alice"`) {
		t.Fatalf("session = %d %s", sessionResponse.Code, sessionResponse.Body.String())
	}

	logout := request(server, http.MethodPost, "/api/logout", nil, cookie)
	logoutCookies := logout.Result().Cookies()
	if len(logoutCookies) == 0 {
		t.Fatalf("logout did not clear the session cookie: %s", logout.Body.String())
	}
	logoutCookie := logoutCookies[0]
	if logout.Code != http.StatusNoContent || logout.Body.Len() != 0 || logoutCookie.MaxAge >= 0 {
		t.Fatalf("logout = %d, cookie=%+v, body=%s", logout.Code, logoutCookie, logout.Body.String())
	}
	assertError(t, request(server, http.MethodGet, "/api/session", nil, cookie), http.StatusUnauthorized)

	badLogin := httptest.NewRecorder()
	server.ServeHTTP(badLogin, httptest.NewRequest(http.MethodPost, "/api/login", strings.NewReader(`{"username":"alice","password":"wrong"}`)))
	assertError(t, badLogin, http.StatusUnauthorized)
}

func TestExpectedUserHeaderRejectsMismatchButRemainsOptional(t *testing.T) {
	server := newServer(time.Hour)
	_, cookie := loginAs(t, server, "alice", "demo-alice")

	withoutAssertion := request(server, http.MethodGet, "/api/jobs", nil, cookie)
	if withoutAssertion.Code != http.StatusOK {
		t.Fatalf("legacy request without identity assertion = %d %s", withoutAssertion.Code, withoutAssertion.Body.String())
	}

	mismatch := httptest.NewRequest(http.MethodGet, "/api/jobs", nil)
	mismatch.AddCookie(cookie)
	mismatch.Header.Set("X-Prototype-User", "bob")
	response := httptest.NewRecorder()
	server.ServeHTTP(response, mismatch)
	assertError(t, response, http.StatusUnauthorized)
}

func TestJobsAreIsolatedAndEditableByOwner(t *testing.T) {
	server := newServer(time.Hour)
	_, aliceCookie := loginAs(t, server, "alice", "demo-alice")
	_, bobCookie := loginAs(t, server, "bob", "demo-bob")

	aliceJobs := getJobs(t, server, aliceCookie)
	bobJobs := getJobs(t, server, bobCookie)
	if len(aliceJobs) != 2 || len(bobJobs) != 2 || aliceJobs[0].ID != "alice-1" || bobJobs[0].ID != "bob-1" {
		t.Fatalf("fixture jobs are not isolated: alice=%+v bob=%+v", aliceJobs, bobJobs)
	}

	wrongOwner := request(server, http.MethodPatch, "/api/jobs/alice-1", strings.NewReader(`{"name":"Changed","priority":3,"status":"paused"}`), bobCookie)
	assertError(t, wrongOwner, http.StatusNotFound)
	unknown := request(server, http.MethodPatch, "/api/jobs/no-such-job", strings.NewReader(`{"name":"Changed","priority":3,"status":"paused"}`), aliceCookie)
	assertError(t, unknown, http.StatusNotFound)

	created := request(server, http.MethodPost, "/api/jobs", strings.NewReader(`{"name":"  New evaluation  ","priority":5,"status":"paused"}`), aliceCookie)
	if created.Code != http.StatusCreated {
		t.Fatalf("create = %d %s", created.Code, created.Body.String())
	}
	var job protocol.Job
	if err := json.Unmarshal(created.Body.Bytes(), &job); err != nil {
		t.Fatal(err)
	}
	if job.ID == "" || job.Name != "New evaluation" || job.Priority != 5 || job.Status != "paused" {
		t.Fatalf("created job = %+v", job)
	}
	var responseFields map[string]json.RawMessage
	if err := json.Unmarshal(created.Body.Bytes(), &responseFields); err != nil {
		t.Fatal(err)
	}
	if _, leaksOwner := responseFields["owner"]; leaksOwner {
		t.Fatalf("job response exposed owner: %s", created.Body.String())
	}

	updated := request(server, http.MethodPatch, "/api/jobs/"+job.ID, strings.NewReader(`{"name":"Updated evaluation","priority":1,"status":"running"}`), aliceCookie)
	if updated.Code != http.StatusOK {
		t.Fatalf("patch = %d %s", updated.Code, updated.Body.String())
	}
	if err := json.Unmarshal(updated.Body.Bytes(), &job); err != nil {
		t.Fatal(err)
	}
	if job.Name != "Updated evaluation" || job.Priority != 1 || job.Status != "running" {
		t.Fatalf("updated job = %+v", job)
	}
	if len(getJobs(t, server, bobCookie)) != 2 {
		t.Fatal("Alice's create changed Bob's jobs")
	}
}

func TestJobInputValidationAndUnknownFields(t *testing.T) {
	server := newServer(time.Hour)
	_, cookie := loginAs(t, server, "alice", "demo-alice")
	longName := strings.Repeat("é", maxJobNameRunes+1)
	tooLargeName, _ := json.Marshal(protocol.JobInput{Name: longName, Priority: 1, Status: "queued"})
	cases := []struct {
		name string
		body string
	}{
		{name: "blank name", body: `{"name":"  ","priority":1,"status":"queued"}`},
		{name: "name too long", body: string(tooLargeName)},
		{name: "priority below range", body: `{"name":"x","priority":0,"status":"queued"}`},
		{name: "priority above range", body: `{"name":"x","priority":6,"status":"queued"}`},
		{name: "non-integer priority", body: `{"name":"x","priority":1.5,"status":"queued"}`},
		{name: "invalid status", body: `{"name":"x","priority":1,"status":"done"}`},
		{name: "unknown id field", body: `{"id":"caller-id","name":"x","priority":1,"status":"queued"}`},
		{name: "unknown owner field", body: `{"name":"x","priority":1,"status":"queued","owner":"bob"}`},
		{name: "extra json value", body: `{"name":"x","priority":1,"status":"queued"} {}`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			response := request(server, http.MethodPost, "/api/jobs", strings.NewReader(tc.body), cookie)
			assertError(t, response, http.StatusBadRequest)
		})
	}
}

func TestMutationRejectsCrossOriginRequests(t *testing.T) {
	server := newServer(time.Hour)
	foreignLogin := httptest.NewRequest(http.MethodPost, "/api/login", strings.NewReader(`{"username":"alice","password":"demo-alice"}`))
	foreignLogin.Header.Set("Origin", "https://attacker.example")
	blockedLogin := httptest.NewRecorder()
	server.ServeHTTP(blockedLogin, foreignLogin)
	assertError(t, blockedLogin, http.StatusForbidden)

	_, cookie := loginAs(t, server, "alice", "demo-alice")
	foreignCreate := httptest.NewRequest(http.MethodPost, "/api/jobs", strings.NewReader(`{"name":"Injected","priority":1,"status":"queued"}`))
	foreignCreate.AddCookie(cookie)
	foreignCreate.Header.Set("Origin", "https://attacker.example")
	blockedCreate := httptest.NewRecorder()
	server.ServeHTTP(blockedCreate, foreignCreate)
	assertError(t, blockedCreate, http.StatusForbidden)
	if got := blockedCreate.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("unexpected CORS response: %q", got)
	}

	sameOrigin := httptest.NewRequest(http.MethodPost, "/api/jobs", strings.NewReader(`{"name":"Local","priority":1,"status":"queued"}`))
	sameOrigin.AddCookie(cookie)
	sameOrigin.Header.Set("Origin", "http://example.com")
	allowed := httptest.NewRecorder()
	server.ServeHTTP(allowed, sameOrigin)
	if allowed.Code != http.StatusCreated {
		t.Fatalf("same-origin request = %d %s", allowed.Code, allowed.Body.String())
	}
}

func TestEventsAreAuthorizedScopedAndCancelSafe(t *testing.T) {
	server := newServer(10 * time.Millisecond)
	anonymous := httptest.NewRecorder()
	server.ServeHTTP(anonymous, httptest.NewRequest(http.MethodGet, "/api/events", nil))
	assertError(t, anonymous, http.StatusUnauthorized)

	_, cookie := loginAs(t, server, "alice", "demo-alice")
	created := request(server, http.MethodPost, "/api/jobs", strings.NewReader(`{"name":"Active fixture","priority":2,"status":"running"}`), cookie)
	if created.Code != http.StatusCreated {
		t.Fatalf("create active fixture = %d %s", created.Code, created.Body.String())
	}

	ctx, cancel := context.WithCancel(context.Background())
	recorder := newStreamRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/events", nil).WithContext(ctx)
	request.AddCookie(cookie)
	done := make(chan struct{})
	go func() {
		server.ServeHTTP(recorder, request)
		close(done)
	}()

	if !waitForSignal(recorder.writes) || !waitForSignal(recorder.writes) {
		cancel()
		select {
		case <-done:
		case <-time.After(time.Second):
		}
		t.Fatal("stream did not emit metrics")
	}
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("stream did not stop after request cancellation")
	}

	if recorder.status != http.StatusOK || recorder.header.Get("Content-Type") != "text/event-stream; charset=utf-8" {
		t.Fatalf("stream headers = status %d, content-type %q", recorder.status, recorder.header.Get("Content-Type"))
	}
	chunks := strings.Split(strings.TrimSpace(recorder.body.String()), "\n\n")
	if len(chunks) < 2 {
		t.Fatalf("expected repeated SSE events, got %q", recorder.body.String())
	}
	for i, chunk := range chunks[:2] {
		if !strings.HasPrefix(chunk, "data: ") {
			t.Fatalf("event %d is not an SSE data frame: %q", i, chunk)
		}
		var metric protocol.Metrics
		if err := json.Unmarshal([]byte(strings.TrimPrefix(chunk, "data: ")), &metric); err != nil {
			t.Fatalf("decode event %d: %v", i, err)
		}
		if metric.Seq != int64(i+1) || metric.Time <= 0 || metric.Active != 2 || metric.Throughput != 2 {
			t.Fatalf("event %d metrics = %+v", i, metric)
		}
	}
}

func TestEventsStopAfterSessionRevocationOrExpiry(t *testing.T) {
	for _, tc := range []struct {
		name string
	}{
		{name: "logout"},
		{name: "expiration"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			server := newServer(10 * time.Millisecond)
			_, cookie := loginAs(t, server, "alice", "demo-alice")

			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			recorder := newStreamRecorder()
			streamRequest := httptest.NewRequest(http.MethodGet, "/api/events", nil).WithContext(ctx)
			streamRequest.AddCookie(cookie)
			done := make(chan struct{})
			go func() {
				server.ServeHTTP(recorder, streamRequest)
				close(done)
			}()

			if !waitForSignal(recorder.writes) {
				cancel()
				<-done
				t.Fatal("stream did not emit its initial metrics")
			}

			switch tc.name {
			case "logout":
				response := request(server, http.MethodPost, "/api/logout", nil, cookie)
				if response.Code != http.StatusNoContent {
					t.Fatalf("logout = %d %s", response.Code, response.Body.String())
				}
			case "expiration":
				server.mu.Lock()
				current, exists := server.sessions[cookie.Value]
				if !exists {
					server.mu.Unlock()
					t.Fatal("session disappeared before expiration")
				}
				current.expiresAt = time.Now().Add(-time.Second)
				server.sessions[cookie.Value] = current
				server.mu.Unlock()
			}

			select {
			case <-done:
			case <-time.After(time.Second):
				cancel()
				<-done
				t.Fatal("stream continued after its session ended")
			}
			if frames := strings.Count(recorder.body.String(), "data: "); frames != 1 {
				t.Fatalf("stream emitted %d metrics, want only the initial frame after session ended; body=%q", frames, recorder.body.String())
			}
		})
	}
}

func loginAs(t *testing.T, handler http.Handler, username, password string) (*httptest.ResponseRecorder, *http.Cookie) {
	t.Helper()
	body := fmt.Sprintf(`{"username":%q,"password":%q}`, username, password)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest(http.MethodPost, "/api/login", strings.NewReader(body)))
	for _, cookie := range response.Result().Cookies() {
		if cookie.Name == sessionCookieName {
			return response, cookie
		}
	}
	t.Fatalf("login response did not set a session cookie: %s", response.Body.String())
	return response, nil
}

func request(handler http.Handler, method, path string, body io.Reader, cookie *http.Cookie) *httptest.ResponseRecorder {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(method, path, body)
	if cookie != nil {
		request.AddCookie(cookie)
	}
	handler.ServeHTTP(response, request)
	return response
}

func getJobs(t *testing.T, handler http.Handler, cookie *http.Cookie) []protocol.Job {
	t.Helper()
	response := request(handler, http.MethodGet, "/api/jobs", nil, cookie)
	if response.Code != http.StatusOK {
		t.Fatalf("GET jobs = %d %s", response.Code, response.Body.String())
	}
	var jobs []protocol.Job
	if err := json.Unmarshal(response.Body.Bytes(), &jobs); err != nil {
		t.Fatal(err)
	}
	return jobs
}

func assertError(t *testing.T, response *httptest.ResponseRecorder, status int) {
	t.Helper()
	if response.Code != status {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, status, response.Body.String())
	}
	var body protocol.ErrorResponse
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("error response is not JSON: %v (%s)", err, response.Body.String())
	}
	if strings.TrimSpace(body.Error) == "" {
		t.Fatalf("error response has no message: %s", response.Body.String())
	}
}

func waitForSignal(ch <-chan struct{}) bool {
	select {
	case <-ch:
		return true
	case <-time.After(time.Second):
		return false
	}
}

type streamRecorder struct {
	header http.Header
	status int
	body   bytes.Buffer
	mu     sync.Mutex
	writes chan struct{}
}

func newStreamRecorder() *streamRecorder {
	return &streamRecorder{header: make(http.Header), writes: make(chan struct{}, 8)}
}

func (w *streamRecorder) Header() http.Header { return w.header }

func (w *streamRecorder) WriteHeader(status int) { w.status = status }

func (w *streamRecorder) Write(data []byte) (int, error) {
	w.mu.Lock()
	if w.status == 0 {
		w.status = http.StatusOK
	}
	n, err := w.body.Write(data)
	w.mu.Unlock()
	select {
	case w.writes <- struct{}{}:
	default:
	}
	return n, err
}

func (w *streamRecorder) Flush() {}
