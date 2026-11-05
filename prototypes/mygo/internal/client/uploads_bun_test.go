package client

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"testing"
)

func TestUploadMultipartParsesAsFileInBun(t *testing.T) {
	bun, err := exec.LookPath("bun")
	if err != nil {
		t.Skip("bun is not installed")
	}

	const script = `
const chunks = [];
for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
const body = Buffer.concat(chunks);
const request = new Request("http://localhost/api/uploads", {
  method: "POST",
  headers: { "content-type": process.env.UPLOAD_TEST_CONTENT_TYPE },
  body,
});
const uploaded = (await request.formData()).getAll("files");
if (uploaded.length !== 1 || !(uploaded[0] instanceof File) || uploaded[0].name !== "README.md" ||
    uploaded[0].type !== "text/markdown" || await uploaded[0].text() !== "# upload parser regression\n") {
  throw new Error("Bun did not parse the upload as the expected file");
}
`
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Errorf("read upload request: %v", err)
			http.Error(w, `{"error":"read failed"}`, http.StatusInternalServerError)
			return
		}
		cmd := exec.CommandContext(r.Context(), bun, "-e", script)
		cmd.Stdin = bytes.NewReader(body)
		cmd.Env = append(os.Environ(), "UPLOAD_TEST_CONTENT_TYPE="+r.Header.Get("Content-Type"))
		if output, err := cmd.CombinedOutput(); err != nil {
			t.Errorf("Bun formData() rejected Go upload: %v: %s", err, output)
			http.Error(w, `{"error":"Bun multipart parse failed"}`, http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]any{"files": []any{}, "lifetimeUploads": 0})
	}))
	defer server.Close()

	api, err := New(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	if err := api.SetWindowID("bun-interop"); err != nil {
		t.Fatal(err)
	}
	api.rememberUser("alice")
	if _, err := api.UploadFiles(context.Background(), []UploadFile{{
		Name: "README.md", Type: "text/markdown", Data: []byte("# upload parser regression\n"),
	}}); err != nil {
		t.Fatalf("UploadFiles() = %v", err)
	}
}
