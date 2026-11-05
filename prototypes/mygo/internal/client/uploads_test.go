package client

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/protocol"
)

func TestUploadsUseAuthenticatedWindowAndPreserveBinaryFiles(t *testing.T) {
	wantA := []byte{0, 0xff, 0x89, 0x50, 0x4e, 0x47, 0x00}
	wantB := []byte("notes\x00with binary\xff")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && r.URL.Path == "/api/login" {
			http.SetCookie(w, &http.Cookie{Name: "clay-mygo-uploads", Value: "alice", Path: "/", HttpOnly: true})
			_ = json.NewEncoder(w).Encode(protocol.User{ID: "alice", Name: "Alice", Role: "Operator"})
			return
		}
		if r.Header.Get("X-Prototype-User") != "alice" || r.Header.Get("X-Prototype-Window") != "window-123" {
			t.Errorf("scope headers = user %q window %q", r.Header.Get("X-Prototype-User"), r.Header.Get("X-Prototype-Window"))
			http.Error(w, `{"error":"scope required"}`, http.StatusUnauthorized)
			return
		}
		if cookie, err := r.Cookie("clay-mygo-uploads"); err != nil || cookie.Value != "alice" {
			t.Errorf("upload session cookie = %v, %v", cookie, err)
			http.Error(w, `{"error":"session required"}`, http.StatusUnauthorized)
			return
		}
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/api/uploads":
			_ = json.NewEncoder(w).Encode(protocol.UploadList{
				Files:           []protocol.UploadedFile{{ID: "up-1", Name: "pixel.png", Size: int64(len(wantA)), Type: "image/png", UploadedAt: "2026-10-21T12:00:00Z"}},
				LifetimeUploads: 2,
			})
		case r.Method == http.MethodPost && r.URL.Path == "/api/uploads":
			reader, err := r.MultipartReader()
			if err != nil {
				t.Errorf("MultipartReader: %v", err)
				http.Error(w, `{"error":"bad multipart"}`, http.StatusBadRequest)
				return
			}
			var names []string
			var contents [][]byte
			for {
				part, err := reader.NextPart()
				if errors.Is(err, io.EOF) {
					break
				}
				if err != nil {
					t.Errorf("NextPart: %v", err)
					return
				}
				if part.FormName() != "files" {
					t.Errorf("multipart field = %q, want files", part.FormName())
				}
				body, err := io.ReadAll(part)
				if err != nil {
					t.Errorf("read multipart body: %v", err)
				}
				names = append(names, part.FileName())
				contents = append(contents, body)
			}
			if len(names) != 2 || names[0] != "pixel.png" || names[1] != "notes.txt" || !bytes.Equal(contents[0], wantA) || !bytes.Equal(contents[1], wantB) {
				t.Errorf("uploaded names=%v contents=%v", names, contents)
				http.Error(w, `{"error":"files did not match"}`, http.StatusBadRequest)
				return
			}
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(protocol.UploadList{
				Files: []protocol.UploadedFile{
					{ID: "up-1", Name: "pixel.png", Size: int64(len(wantA)), Type: "image/png", UploadedAt: "2026-10-21T12:00:00Z"},
					{ID: "up-2", Name: "notes.txt", Size: int64(len(wantB)), Type: "text/plain", UploadedAt: "2026-10-21T12:01:00Z"},
				}, LifetimeUploads: 4,
			})
		case r.Method == http.MethodGet && r.URL.Path == "/api/uploads/up-1/content":
			w.Header().Set("Content-Type", "image/png")
			w.Header().Set("Content-Disposition", `attachment; filename="pixel.png"`)
			_, _ = w.Write(wantA)
		case r.Method == http.MethodDelete && r.URL.Path == "/api/uploads/up-1":
			w.WriteHeader(http.StatusNoContent)
		case r.URL.Path == "/api/uploads/missing/content":
			http.Error(w, `{"error":"file not found"}`, http.StatusNotFound)
		default:
			t.Errorf("unexpected request %s %s", r.Method, r.URL.Path)
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	api, err := New(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	if err := api.SetWindowID("window-123"); err != nil {
		t.Fatal(err)
	}
	if _, err := api.Login(context.Background(), "alice", "demo-alice"); err != nil {
		t.Fatal(err)
	}

	list, err := api.ListUploads(context.Background())
	if err != nil || len(list.Files) != 1 || list.LifetimeUploads != 2 || list.Files[0].UploadedAt != "2026-10-21T12:00:00Z" {
		t.Fatalf("ListUploads() = %+v, %v", list, err)
	}
	list, err = api.UploadFiles(context.Background(), []UploadFile{
		{Name: "pixel.png", Type: "image/png", Data: wantA},
		{Name: "notes.txt", Type: "text/plain; charset=utf-8", Data: wantB},
	})
	if err != nil || len(list.Files) != 2 || list.LifetimeUploads != 4 {
		t.Fatalf("UploadFiles() = %+v, %v", list, err)
	}
	data, err := api.DownloadUpload(context.Background(), "up-1")
	if err != nil || !bytes.Equal(data, wantA) {
		t.Fatalf("DownloadUpload() = %v, %v", data, err)
	}
	if err := api.DeleteUpload(context.Background(), "up-1"); err != nil {
		t.Fatalf("DeleteUpload() = %v", err)
	}
}

func TestUploadClientValidationAndHTTPErrors(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_, _ = io.WriteString(w, `{"error":"file not found"}`)
	}))
	defer server.Close()
	api, err := New(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	_ = api.SetWindowID("window")
	api.rememberUser("alice")
	if _, err := api.UploadFiles(context.Background(), nil); err == nil || err.Error() != "choose at least one file" {
		t.Fatalf("empty upload error = %v", err)
	}
	if _, err := api.UploadFiles(context.Background(), []UploadFile{{Name: "../outside.txt"}}); err == nil {
		t.Fatalf("unsafe filename error = %v, want validation error", err)
	}
	if _, err := api.UploadFiles(context.Background(), []UploadFile{{Name: "README.md\r\nX-Injected: yes"}}); err == nil || err.Error() != "file name cannot contain control characters" {
		t.Fatalf("newline filename error = %v, want control-character validation error", err)
	}
	if _, err := api.UploadFiles(context.Background(), []UploadFile{{Name: "large.txt", Data: bytes.Repeat([]byte{1}, int(MaxUploadSize+1))}}); err == nil {
		t.Fatalf("oversize upload error = %v, want validation error", err)
	}
	_, err = api.DownloadUpload(context.Background(), "missing")
	var apiErr *HTTPError
	if !errors.As(err, &apiErr) || apiErr.Status != http.StatusNotFound || err.Error() != "file not found" {
		t.Fatalf("missing download error = %v", err)
	}
	if err := api.DeleteUpload(context.Background(), "missing"); !errors.As(err, &apiErr) || apiErr.Status != http.StatusNotFound {
		t.Fatalf("missing delete error = %v", err)
	}
}

func TestUploadRejectsTooManyFilesBeforeRequest(t *testing.T) {
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		http.Error(w, `{"error":"unexpected request"}`, http.StatusInternalServerError)
	}))
	defer server.Close()
	api, err := New(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	if err := api.SetWindowID("window"); err != nil {
		t.Fatal(err)
	}
	api.rememberUser("alice")

	files := make([]UploadFile, MaxUploadFiles+1)
	_, err = api.UploadFiles(context.Background(), files)
	if err == nil || err.Error() != "cannot upload more than 10 files" {
		t.Fatalf("UploadFiles() error = %v, want too-many-files validation error", err)
	}
	if got := requests.Load(); got != 0 {
		t.Fatalf("request count = %d, want no request", got)
	}
}

func TestSetWindowIDValidatesAndDoesNotChangeUserGuard(t *testing.T) {
	api, err := New("http://example.test")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := api.ListUploads(context.Background()); err == nil || err.Error() != "uploads window ID is not configured" {
		t.Fatalf("missing window ID error = %v", err)
	}
	for _, id := range []string{"", " leading", "trailing ", "has\nnewline", string(bytes.Repeat([]byte{'x'}, 81))} {
		if err := api.SetWindowID(id); err == nil {
			t.Errorf("SetWindowID(%q) accepted invalid value", id)
		}
	}
	if err := api.SetWindowID("tab-1"); err != nil {
		t.Fatal(err)
	}
	api.rememberUser("alice")
	api.http = &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
		if req.Header.Get("X-Prototype-User") != "alice" || req.Header.Get("X-Prototype-Window") != "tab-1" {
			t.Errorf("headers = %v", req.Header)
		}
		return &http.Response{StatusCode: http.StatusNoContent, Header: make(http.Header), Body: io.NopCloser(bytes.NewReader(nil)), Request: req}, nil
	})}
	if err := api.DeleteUpload(context.Background(), "id"); err != nil {
		t.Fatal(err)
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) { return f(req) }
