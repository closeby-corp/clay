//go:build !js

package uploadsapp

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/client"
)

type failingWriter struct{ err error }

func (w failingWriter) Write([]byte) (int, error) { return 0, w.err }

type shortWriter struct{}

func (shortWriter) Write(p []byte) (int, error) { return len(p) - 1, nil }

func TestWriteAllReportsWriteFailures(t *testing.T) {
	writeErr := errors.New("write failed")
	if err := writeAll(failingWriter{err: writeErr}, []byte("data")); !errors.Is(err, writeErr) {
		t.Fatalf("writeAll error = %v, want %v", err, writeErr)
	}
	if err := writeAll(shortWriter{}, []byte("data")); !errors.Is(err, io.ErrShortWrite) {
		t.Fatalf("writeAll short-write error = %v, want %v", err, io.ErrShortWrite)
	}
}

func TestReadSelectedFilesRejectsCountBeforeReading(t *testing.T) {
	missingPath := filepath.Join(t.TempDir(), "missing.txt")
	paths := make([]string, client.MaxUploadFiles+1)
	for i := range paths {
		paths[i] = missingPath
	}
	_, err := readSelectedFiles(paths)
	if err == nil || !strings.Contains(err.Error(), fmt.Sprintf("up to %d files", client.MaxUploadFiles)) {
		t.Fatalf("readSelectedFiles error = %v, want count rejection before file access", err)
	}
}

func TestWriteDownloadFilePreservesDestinationOnCommitFailure(t *testing.T) {
	dir := t.TempDir()
	target := filepath.Join(dir, "existing-target")
	if err := os.Mkdir(target, 0o700); err != nil {
		t.Fatal(err)
	}
	sentinel := filepath.Join(target, "keep.txt")
	if err := os.WriteFile(sentinel, []byte("original"), 0o600); err != nil {
		t.Fatal(err)
	}

	if err := writeDownloadFile(target, []byte("replacement")); err == nil {
		t.Fatal("writeDownloadFile unexpectedly committed over a directory")
	}
	got, err := os.ReadFile(sentinel)
	if err != nil || string(got) != "original" {
		t.Fatalf("original destination content = %q, %v", got, err)
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 || entries[0].Name() != filepath.Base(target) {
		t.Fatalf("temporary download file was left behind: %v", entries)
	}
}

func TestWriteDownloadFilePreservesDestinationOnWriteFailure(t *testing.T) {
	dir := t.TempDir()
	target := filepath.Join(dir, "existing.txt")
	if err := os.WriteFile(target, []byte("original"), 0o600); err != nil {
		t.Fatal(err)
	}
	writeErr := errors.New("disk full")
	if err := writeDownloadFileWith(target, []byte("replacement"), func(io.Writer, []byte) error {
		return writeErr
	}); !errors.Is(err, writeErr) {
		t.Fatalf("writeDownloadFileWith error = %v, want %v", err, writeErr)
	}
	got, err := os.ReadFile(target)
	if err != nil || string(got) != "original" {
		t.Fatalf("original destination content = %q, %v", got, err)
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 || entries[0].Name() != filepath.Base(target) {
		t.Fatalf("temporary download file was left behind: %v", entries)
	}
}
