package uploadsapp

import (
	"errors"
	"fmt"
	"mime"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/client"
)

const acceptFiles = "image/*,.txt,.md,.pdf,.csv"

var errSaveCanceled = errors.New("save canceled")

type LocalFile struct {
	Name string
	Type string
	Data []byte
}

func uploadInputs(files []LocalFile) ([]client.UploadFile, error) {
	if len(files) == 0 {
		return nil, errors.New("Choose at least one file.")
	}
	if len(files) > client.MaxUploadFiles {
		return nil, fmt.Errorf("Choose up to %d files.", client.MaxUploadFiles)
	}
	out := make([]client.UploadFile, 0, len(files))
	for _, file := range files {
		if strings.ContainsAny(file.Name, "/\\\r\n\x00") || file.Name == "" || file.Name == "." || file.Name == ".." {
			return nil, errors.New("A selected file has an invalid name.")
		}
		if int64(len(file.Data)) > client.MaxUploadSize {
			return nil, fmt.Errorf("%s exceeds the 5 MiB file limit.", file.Name)
		}
		contentType := strings.TrimSpace(file.Type)
		if contentType == "" {
			contentType = mime.TypeByExtension(strings.ToLower(filepath.Ext(file.Name)))
		}
		if contentType == "" || contentType == "application/octet-stream" {
			contentType = http.DetectContentType(file.Data[:min(len(file.Data), 512)])
		}
		mediaType, _, _ := mime.ParseMediaType(contentType)
		extension := strings.ToLower(filepath.Ext(file.Name))
		acceptedDocument := extension == ".txt" || extension == ".md" || extension == ".pdf" || extension == ".csv"
		if !strings.HasPrefix(strings.ToLower(mediaType), "image/") && !acceptedDocument {
			return nil, fmt.Errorf("%s is not an accepted image, text, Markdown, PDF, or CSV file.", file.Name)
		}
		if mediaType == "" || mediaType == "application/octet-stream" {
			if acceptedDocument {
				switch extension {
				case ".md", ".txt", ".csv":
					contentType = "text/plain"
				case ".pdf":
					contentType = "application/pdf"
				}
			}
		}
		out = append(out, client.UploadFile{Name: file.Name, Type: contentType, Data: file.Data})
	}
	return out, nil
}
