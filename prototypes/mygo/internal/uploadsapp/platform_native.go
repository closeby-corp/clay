//go:build !js

package uploadsapp

import (
	"context"
	"crypto/rand"
	"fmt"
	"io"
	"mime"
	"os"
	"path/filepath"
	"strings"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/client"
	"github.com/egoist/mygo"
)

func newWindowID() string {
	var value [16]byte
	if _, err := rand.Read(value[:]); err != nil {
		panic("generate uploads window ID: " + err.Error())
	}
	value[6] = value[6]&0x0f | 0x40
	value[8] = value[8]&0x3f | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", value[0:4], value[4:6], value[6:8], value[8:10], value[10:16])
}

func pickFiles(window *mygo.Window, done func([]LocalFile, error)) {
	go func() {
		paths, err := mygo.Dialog.Open(mygo.OpenDialogOptions{
			Parent: window, Title: "Choose files to upload", ButtonLabel: "Choose files", Multiple: true,
			Message: fmt.Sprintf("Images, TXT, MD, PDF, or CSV · up to %d files, 5 MiB each", client.MaxUploadFiles),
			Filters: []mygo.FileFilter{{Name: "Images and documents", Extensions: []string{
				"3fr", "arw", "avif", "bmp", "cr2", "cr3", "dcr", "dng", "emf", "eps", "erf", "gif",
				"heic", "heif", "ico", "jfif", "jng", "jp2", "jpe", "jpeg", "jpg", "jxl", "nef", "nrw",
				"orf", "pef", "png", "psd", "raw", "rw2", "svg", "tif", "tiff", "webp", "wmf",
				"txt", "md", "pdf", "csv",
			}}},
		})
		if err != nil || len(paths) == 0 {
			done(nil, err)
			return
		}
		files, err := readSelectedFiles(paths)
		done(files, err)
	}()
}

func readSelectedFiles(paths []string) ([]LocalFile, error) {
	if len(paths) > client.MaxUploadFiles {
		return nil, fmt.Errorf("Choose up to %d files.", client.MaxUploadFiles)
	}
	files := make([]LocalFile, 0, len(paths))
	for _, path := range paths {
		info, err := os.Stat(path)
		if err != nil {
			return nil, fmt.Errorf("could not read %s: %w", filepath.Base(path), err)
		}
		if !info.Mode().IsRegular() {
			return nil, fmt.Errorf("%s is not a regular file", filepath.Base(path))
		}
		if info.Size() > 5<<20 {
			return nil, fmt.Errorf("%s exceeds the 5 MiB file limit", filepath.Base(path))
		}
		f, err := os.Open(path)
		if err != nil {
			return nil, fmt.Errorf("could not read %s: %w", filepath.Base(path), err)
		}
		data, readErr := io.ReadAll(io.LimitReader(f, (5<<20)+1))
		closeErr := f.Close()
		if readErr != nil {
			return nil, fmt.Errorf("could not read %s: %w", filepath.Base(path), readErr)
		}
		if closeErr != nil {
			return nil, fmt.Errorf("could not read %s: %w", filepath.Base(path), closeErr)
		}
		if len(data) > 5<<20 {
			return nil, fmt.Errorf("%s exceeds the 5 MiB file limit", filepath.Base(path))
		}
		name := filepath.Base(path)
		contentType := mime.TypeByExtension(strings.ToLower(filepath.Ext(name)))
		files = append(files, LocalFile{Name: name, Type: contentType, Data: data})
	}
	return files, nil
}

func saveDownload(ctx context.Context, window *mygo.Window, name, contentType string, data []byte, done func(error)) {
	filters := []mygo.FileFilter{}
	extension := strings.TrimPrefix(filepath.Ext(name), ".")
	defaultPath := name
	if extension == "" {
		if known, err := mime.ExtensionsByType(contentType); err == nil && len(known) > 0 {
			extension = strings.TrimPrefix(known[0], ".")
			defaultPath += "." + extension
		}
	}
	if extension != "" {
		filters = append(filters, mygo.FileFilter{Name: strings.ToUpper(extension) + " file", Extensions: []string{extension}})
	}
	path, err := mygo.Dialog.Save(mygo.SaveDialogOptions{
		Parent: window, Title: "Save uploaded file", ButtonLabel: "Save", DefaultPath: defaultPath, Filters: filters,
	})
	if err != nil {
		done(err)
		return
	}
	if path == "" {
		done(errSaveCanceled)
		return
	}
	if err := ctx.Err(); err != nil {
		done(err)
		return
	}
	if err := writeDownloadFile(path, data); err != nil {
		done(fmt.Errorf("could not save %s: %w", filepath.Base(path), err))
		return
	}
	done(nil)
}

func writeDownloadFile(path string, data []byte) error {
	return writeDownloadFileWith(path, data, writeAll)
}

func writeDownloadFileWith(path string, data []byte, write func(io.Writer, []byte) error) error {
	f, err := os.CreateTemp(filepath.Dir(path), ".clay-upload-*")
	if err != nil {
		return err
	}
	tempPath := f.Name()
	defer os.Remove(tempPath)
	if err := write(f, data); err != nil {
		_ = f.Close()
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	return os.Rename(tempPath, path)
}

func writeAll(w io.Writer, data []byte) error {
	n, err := w.Write(data)
	if err != nil {
		return err
	}
	if n != len(data) {
		return io.ErrShortWrite
	}
	return nil
}

func copyName(name string, done func(error)) {
	mygo.Clipboard.WriteText(name)
	done(nil)
}
