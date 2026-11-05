package client

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"unicode"
	"unicode/utf8"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/protocol"
)

// API is the authenticated backend surface the UI needs.
type API interface {
	Login(context.Context, string, string) (protocol.User, error)
	Session(context.Context) (protocol.User, error)
	Logout(context.Context) error
	Jobs(context.Context) ([]protocol.Job, error)
	CreateJob(context.Context, protocol.JobInput) (protocol.Job, error)
	UpdateJob(context.Context, string, protocol.JobInput) (protocol.Job, error)
	StreamMetrics(context.Context, func(protocol.Metrics)) error
}

// Client talks to the same-origin browser API or a native API base URL.
type Client struct {
	base       *url.URL
	http       *http.Client
	mu         sync.RWMutex
	expectedID string
	windowID   string
}

// HTTPError is a non-success API response.
type HTTPError struct {
	Status  int
	Message string
}

func (e *HTTPError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return http.StatusText(e.Status)
}

func IsUnauthorized(err error) bool {
	var apiErr *HTTPError
	return errors.As(err, &apiErr) && apiErr.Status == http.StatusUnauthorized
}

func New(baseURL string) (*Client, error) {
	base, err := url.Parse(strings.TrimSpace(baseURL))
	if err != nil || (base.Scheme != "http" && base.Scheme != "https") || base.Host == "" {
		return nil, fmt.Errorf("invalid API base URL %q", baseURL)
	}
	base.Path = strings.TrimRight(base.Path, "/")
	base.RawQuery = ""
	base.Fragment = ""
	return &Client{base: base, http: newHTTPClient()}, nil
}

func (c *Client) Login(ctx context.Context, username, password string) (protocol.User, error) {
	var user protocol.User
	err := c.json(ctx, http.MethodPost, "/api/login", map[string]string{"username": username, "password": password}, http.StatusOK, &user, false)
	if err == nil {
		c.rememberUser(user.ID)
	}
	return user, err
}

func (c *Client) Session(ctx context.Context) (protocol.User, error) {
	var user protocol.User
	err := c.json(ctx, http.MethodGet, "/api/session", nil, http.StatusOK, &user, false)
	if err == nil {
		c.rememberUser(user.ID)
	}
	return user, err
}

func (c *Client) Logout(ctx context.Context) error {
	resp, err := c.request(ctx, http.MethodPost, "/api/logout", nil, "", true)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		return responseError(resp)
	}
	c.rememberUser("")
	return nil
}

func (c *Client) Jobs(ctx context.Context) ([]protocol.Job, error) {
	var jobs []protocol.Job
	err := c.json(ctx, http.MethodGet, "/api/jobs", nil, http.StatusOK, &jobs, true)
	return jobs, err
}

func (c *Client) CreateJob(ctx context.Context, input protocol.JobInput) (protocol.Job, error) {
	var job protocol.Job
	err := c.json(ctx, http.MethodPost, "/api/jobs", input, http.StatusCreated, &job, true)
	return job, err
}

func (c *Client) UpdateJob(ctx context.Context, id string, input protocol.JobInput) (protocol.Job, error) {
	var job protocol.Job
	err := c.json(ctx, http.MethodPatch, "/api/jobs/"+id, input, http.StatusOK, &job, true)
	return job, err
}

// SetWindowID adds the uploads workflow's per-window scope to authenticated requests.
func (c *Client) SetWindowID(id string) error {
	if id == "" || strings.TrimSpace(id) != id || utf8.RuneCountInString(id) > 80 {
		return errors.New("window ID must contain 1 to 80 non-space characters")
	}
	for _, r := range id {
		if unicode.IsControl(r) {
			return errors.New("window ID cannot contain control characters")
		}
	}
	c.mu.Lock()
	c.windowID = id
	c.mu.Unlock()
	return nil
}

func (c *Client) StreamMetrics(ctx context.Context, receive func(protocol.Metrics)) error {
	resp, err := c.request(ctx, http.MethodGet, "/api/events", nil, "text/event-stream", true)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return responseError(resp)
	}

	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 4096), 1<<20)
	var data []string
	dispatch := func() error {
		if len(data) == 0 {
			return nil
		}
		var metric protocol.Metrics
		err := json.Unmarshal([]byte(strings.Join(data, "\n")), &metric)
		data = data[:0]
		if err != nil {
			return fmt.Errorf("decode metrics event: %w", err)
		}
		if receive != nil {
			receive(metric)
		}
		return nil
	}
	for scanner.Scan() {
		line := strings.TrimSuffix(scanner.Text(), "\r")
		if line == "" {
			if err := dispatch(); err != nil {
				return err
			}
			continue
		}
		if strings.HasPrefix(line, ":") {
			continue
		}
		field, value, ok := strings.Cut(line, ":")
		if !ok || field != "data" {
			continue
		}
		data = append(data, strings.TrimPrefix(value, " "))
	}
	if err := dispatch(); err != nil {
		return err
	}
	return scanner.Err()
}

func (c *Client) json(ctx context.Context, method, path string, payload any, want int, out any, authenticated bool) error {
	resp, err := c.request(ctx, method, path, payload, "application/json", authenticated)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != want {
		return responseError(resp)
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 2<<20)).Decode(out); err != nil {
		return fmt.Errorf("decode API response: %w", err)
	}
	return nil
}

func (c *Client) request(ctx context.Context, method, path string, payload any, accept string, authenticated bool) (*http.Response, error) {
	var body io.Reader
	contentType := ""
	if payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			return nil, fmt.Errorf("encode API request: %w", err)
		}
		body = bytes.NewReader(encoded)
		contentType = "application/json"
	}
	return c.requestBody(ctx, method, path, body, contentType, accept, authenticated)
}

func (c *Client) requestBody(ctx context.Context, method, path string, body io.Reader, contentType, accept string, authenticated bool) (*http.Response, error) {
	u := *c.base
	escapedPath := strings.TrimRight(c.base.EscapedPath(), "/") + path
	decodedPath, err := url.PathUnescape(escapedPath)
	if err != nil {
		return nil, fmt.Errorf("invalid API path: %w", err)
	}
	u.Path, u.RawPath = decodedPath, escapedPath
	req, err := http.NewRequestWithContext(ctx, method, u.String(), body)
	if err != nil {
		return nil, err
	}
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	if accept != "" {
		req.Header.Set("Accept", accept)
	}
	if authenticated {
		c.mu.RLock()
		expectedID, windowID := c.expectedID, c.windowID
		c.mu.RUnlock()
		req.Header.Set("X-Prototype-User", expectedID)
		if windowID != "" {
			req.Header.Set("X-Prototype-Window", windowID)
		}
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (c *Client) rememberUser(id string) {
	c.mu.Lock()
	c.expectedID = id
	c.mu.Unlock()
}

func responseError(resp *http.Response) error {
	var body protocol.ErrorResponse
	_ = json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&body)
	return &HTTPError{Status: resp.StatusCode, Message: body.Error}
}
