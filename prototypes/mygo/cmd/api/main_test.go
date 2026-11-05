package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/api"
)

func TestStaticAssetsAndAPIHealth(t *testing.T) {
	assets := t.TempDir()
	for name, contents := range map[string]string{
		"index.html":   "<html>mygo</html>",
		"wasm_exec.js": "globalThis.go = true;",
		"app.wasm":     "wasm-binary",
	} {
		if err := os.WriteFile(filepath.Join(assets, name), []byte(contents), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	handler := newHandler(api.NewServer(), assets)

	for _, tc := range []struct {
		path        string
		contentType string
		body        string
	}{
		{path: "/", body: "<html>mygo</html>"},
		{path: "/wasm_exec.js", body: "globalThis.go = true;"},
		{path: "/app.wasm", contentType: "application/wasm", body: "wasm-binary"},
	} {
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, tc.path, nil))
		if response.Code != http.StatusOK || response.Body.String() != tc.body {
			t.Errorf("GET %s = %d %q", tc.path, response.Code, response.Body.String())
		}
		if tc.contentType != "" && response.Header().Get("Content-Type") != tc.contentType {
			t.Errorf("GET %s content type = %q", tc.path, response.Header().Get("Content-Type"))
		}
	}

	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/health", nil))
	if response.Code != http.StatusOK {
		t.Fatalf("GET /api/health = %d %s", response.Code, response.Body.String())
	}
}
