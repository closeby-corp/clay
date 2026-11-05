// Package api implements the local, in-memory MyGo evaluation API.
package api

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/protocol"
)

const (
	sessionCookieName = "mygo_session"
	maxRequestBody    = 1 << 20
	maxJobNameRunes   = 120
	sessionLifetime   = 12 * time.Hour
)

type account struct {
	user     protocol.User
	password string
}

type session struct {
	username  string
	expiresAt time.Time
}

type storedJob struct {
	job   protocol.Job
	owner string
}

// Server is intentionally in-memory and seeded with demo-only accounts
// (alice/demo-alice and bob/demo-bob) and jobs. Sessions and edits disappear on
// restart. This is prototype state, not production authentication or persistence.
type Server struct {
	mu              sync.RWMutex
	accounts        map[string]account
	sessions        map[string]session
	jobs            map[string]storedJob
	nextJobID       int
	metricsInterval time.Duration
}

func NewServer() *Server {
	return newServer(time.Second)
}

func newServer(metricsInterval time.Duration) *Server {
	s := &Server{
		accounts: map[string]account{
			"alice": {user: protocol.User{ID: "alice", Name: "Alice", Role: "user"}, password: "demo-alice"},
			"bob":   {user: protocol.User{ID: "bob", Name: "Bob", Role: "user"}, password: "demo-bob"},
		},
		sessions:        make(map[string]session),
		jobs:            make(map[string]storedJob),
		metricsInterval: metricsInterval,
	}
	// The owner field is kept beside each job and is never serialized to clients.
	for _, item := range []struct {
		owner string
		job   protocol.Job
	}{
		{owner: "alice", job: protocol.Job{ID: "alice-1", Name: "Review evaluation samples", Priority: 1, Status: "running"}},
		{owner: "alice", job: protocol.Job{ID: "alice-2", Name: "Summarize model responses", Priority: 2, Status: "queued"}},
		{owner: "bob", job: protocol.Job{ID: "bob-1", Name: "Prepare comparison notes", Priority: 2, Status: "paused"}},
		{owner: "bob", job: protocol.Job{ID: "bob-2", Name: "Check evaluation labels", Priority: 3, Status: "running"}},
	} {
		s.jobs[item.job.ID] = storedJob{job: item.job, owner: item.owner}
	}
	return s
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if isMutation(r.Method) && !sameOriginIfPresent(w, r) {
		return
	}

	switch {
	case r.URL.Path == "/api/health":
		s.health(w, r)
	case r.URL.Path == "/api/login":
		s.login(w, r)
	case r.URL.Path == "/api/session":
		s.getSession(w, r)
	case r.URL.Path == "/api/logout":
		s.logout(w, r)
	case r.URL.Path == "/api/jobs":
		s.jobsCollection(w, r)
	case strings.HasPrefix(r.URL.Path, "/api/jobs/"):
		s.jobItem(w, r)
	case r.URL.Path == "/api/events":
		s.events(w, r)
	default:
		writeError(w, http.StatusNotFound, "API endpoint not found")
	}
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w, http.MethodGet)
		return
	}
	writeJSON(w, http.StatusOK, struct {
		Status string `json:"status"`
	}{Status: "ok"})
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w, http.MethodPost)
		return
	}
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := decodeJSON(w, r, &input); err != nil {
		writeBodyError(w, err)
		return
	}
	account, ok := s.accounts[input.Username]
	if !ok || account.password != input.Password {
		writeError(w, http.StatusUnauthorized, "invalid username or password")
		return
	}
	token, err := newSessionToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create session")
		return
	}
	expiresAt := time.Now().Add(sessionLifetime)
	s.mu.Lock()
	if cookie, err := r.Cookie(sessionCookieName); err == nil {
		delete(s.sessions, cookie.Value)
	}
	s.sessions[token] = session{username: input.Username, expiresAt: expiresAt}
	s.mu.Unlock()
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  expiresAt,
		MaxAge:   int(sessionLifetime.Seconds()),
	})
	writeJSON(w, http.StatusOK, account.user)
}

func (s *Server) getSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w, http.MethodGet)
		return
	}
	_, user, ok := s.userForRequest(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "sign in required")
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w, http.MethodPost)
		return
	}
	if _, _, ok := s.userForRequest(r); !ok {
		writeError(w, http.StatusUnauthorized, "sign in required")
		return
	}
	if cookie, err := r.Cookie(sessionCookieName); err == nil {
		s.mu.Lock()
		delete(s.sessions, cookie.Value)
		s.mu.Unlock()
	}
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(1, 0),
		MaxAge:   -1,
	})
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) jobsCollection(w http.ResponseWriter, r *http.Request) {
	username, _, ok := s.userForRequest(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "sign in required")
		return
	}
	switch r.Method {
	case http.MethodGet:
		jobs := make([]protocol.Job, 0)
		s.mu.RLock()
		for _, item := range s.jobs {
			if item.owner == username {
				jobs = append(jobs, item.job)
			}
		}
		s.mu.RUnlock()
		sort.Slice(jobs, func(i, j int) bool { return jobs[i].ID < jobs[j].ID })
		writeJSON(w, http.StatusOK, jobs)
	case http.MethodPost:
		var input protocol.JobInput
		if err := decodeJSON(w, r, &input); err != nil {
			writeBodyError(w, err)
			return
		}
		input, message := validateJob(input)
		if message != "" {
			writeError(w, http.StatusBadRequest, message)
			return
		}
		s.mu.Lock()
		job := protocol.Job{
			ID:       s.newJobIDLocked(),
			Name:     input.Name,
			Priority: input.Priority,
			Status:   input.Status,
		}
		s.jobs[job.ID] = storedJob{job: job, owner: username}
		s.mu.Unlock()
		writeJSON(w, http.StatusCreated, job)
	default:
		methodNotAllowed(w, http.MethodGet+", "+http.MethodPost)
	}
}

func (s *Server) jobItem(w http.ResponseWriter, r *http.Request) {
	username, _, ok := s.userForRequest(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "sign in required")
		return
	}
	if r.Method != http.MethodPatch {
		methodNotAllowed(w, http.MethodPatch)
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/api/jobs/")
	if id == "" || strings.Contains(id, "/") {
		writeError(w, http.StatusNotFound, "job not found")
		return
	}
	s.mu.RLock()
	item, exists := s.jobs[id]
	s.mu.RUnlock()
	if !exists || item.owner != username {
		writeError(w, http.StatusNotFound, "job not found")
		return
	}
	var input protocol.JobInput
	if err := decodeJSON(w, r, &input); err != nil {
		writeBodyError(w, err)
		return
	}
	input, message := validateJob(input)
	if message != "" {
		writeError(w, http.StatusBadRequest, message)
		return
	}
	s.mu.Lock()
	item, exists = s.jobs[id]
	if !exists || item.owner != username {
		s.mu.Unlock()
		writeError(w, http.StatusNotFound, "job not found")
		return
	}
	item.job.Name = input.Name
	item.job.Priority = input.Priority
	item.job.Status = input.Status
	s.jobs[id] = item
	s.mu.Unlock()
	writeJSON(w, http.StatusOK, item.job)
}

func (s *Server) events(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w, http.MethodGet)
		return
	}
	username, _, ok := s.userForRequest(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "sign in required")
		return
	}
	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "streaming is unavailable")
		return
	}
	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("X-Accel-Buffering", "no")
	if r.Context().Err() != nil {
		return
	}
	var seq int64
	if !s.writeMetric(w, username, seq+1) {
		return
	}
	seq++
	flusher.Flush()
	ticker := time.NewTicker(s.metricsInterval)
	defer ticker.Stop()
	for {
		select {
		case <-r.Context().Done():
			return
		case <-ticker.C:
			if _, _, ok := s.userForRequest(r); !ok {
				return
			}
			if !s.writeMetric(w, username, seq+1) {
				return
			}
			seq++
			flusher.Flush()
		}
	}
}

func (s *Server) writeMetric(w http.ResponseWriter, username string, seq int64) bool {
	active := 0
	s.mu.RLock()
	for _, item := range s.jobs {
		if item.owner == username && item.job.Status == "running" {
			active++
		}
	}
	s.mu.RUnlock()
	metric := protocol.Metrics{
		Seq:        seq,
		Time:       time.Now().UnixMilli(),
		Active:     active,
		Throughput: float64(active), // Demo estimate: one unit per active fixture job.
	}
	data, err := json.Marshal(metric)
	if err != nil {
		return false
	}
	_, err = fmt.Fprintf(w, "data: %s\n\n", data)
	return err == nil
}

func (s *Server) userForRequest(r *http.Request) (string, protocol.User, bool) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return "", protocol.User{}, false
	}
	s.mu.RLock()
	current, ok := s.sessions[cookie.Value]
	s.mu.RUnlock()
	if !ok {
		return "", protocol.User{}, false
	}
	if !time.Now().Before(current.expiresAt) {
		s.mu.Lock()
		if latest, exists := s.sessions[cookie.Value]; exists && latest.expiresAt.Equal(current.expiresAt) {
			delete(s.sessions, cookie.Value)
		}
		s.mu.Unlock()
		return "", protocol.User{}, false
	}
	account, ok := s.accounts[current.username]
	if !ok {
		return "", protocol.User{}, false
	}
	if expectedID, exists := r.Header[http.CanonicalHeaderKey("X-Prototype-User")]; exists && (len(expectedID) != 1 || expectedID[0] != current.username) {
		return "", protocol.User{}, false
	}
	return current.username, account.user, true
}

func (s *Server) newJobIDLocked() string {
	for {
		s.nextJobID++
		id := fmt.Sprintf("job-%d", s.nextJobID)
		if _, exists := s.jobs[id]; !exists {
			return id
		}
	}
}

func validateJob(input protocol.JobInput) (protocol.JobInput, string) {
	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" {
		return input, "name is required"
	}
	if utf8.RuneCountInString(input.Name) > maxJobNameRunes {
		return input, fmt.Sprintf("name must be %d characters or fewer", maxJobNameRunes)
	}
	if input.Priority < 1 || input.Priority > 5 {
		return input, "priority must be an integer from 1 to 5"
	}
	switch input.Status {
	case "queued", "running", "paused":
	default:
		return input, "status must be queued, running, or paused"
	}
	return input, ""
}

func decodeJSON(w http.ResponseWriter, r *http.Request, target any) error {
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBody))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}
	var extra any
	if err := decoder.Decode(&extra); !errors.Is(err, io.EOF) {
		if err == nil {
			return errors.New("multiple JSON values")
		}
		return err
	}
	return nil
}

func newSessionToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func isMutation(method string) bool {
	return method == http.MethodPost || method == http.MethodPatch || method == http.MethodPut || method == http.MethodDelete
}

func sameOriginIfPresent(w http.ResponseWriter, r *http.Request) bool {
	origins := r.Header.Values("Origin")
	if len(origins) == 0 {
		return true
	}
	if len(origins) != 1 || !sameOrigin(origins[0], r) {
		writeError(w, http.StatusForbidden, "cross-origin mutation is not allowed")
		return false
	}
	return true
}

func sameOrigin(origin string, r *http.Request) bool {
	parsed, err := url.Parse(origin)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" || parsed.User != nil || parsed.Path != "" || parsed.RawQuery != "" || parsed.Fragment != "" {
		return false
	}
	expectedScheme := "http"
	if r.TLS != nil {
		expectedScheme = "https"
	}
	return strings.EqualFold(parsed.Scheme, expectedScheme) && strings.EqualFold(parsed.Host, r.Host)
}

func writeBodyError(w http.ResponseWriter, err error) {
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		writeError(w, http.StatusRequestEntityTooLarge, "request body is too large")
		return
	}
	writeError(w, http.StatusBadRequest, "invalid JSON body")
}

func methodNotAllowed(w http.ResponseWriter, allow string) {
	w.Header().Set("Allow", allow)
	writeError(w, http.StatusMethodNotAllowed, "method not allowed")
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, protocol.ErrorResponse{Error: message})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
