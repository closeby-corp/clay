package client

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"path/filepath"
	"strings"
	"unicode"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/protocol"
)

const (
	MaxUploadFiles       = 10
	MaxUploadSize  int64 = 5 << 20
)

// UploadFile is one real local file sent through the Clay upload workflow.
type UploadFile struct {
	Name string
	Type string
	Data []byte
}

// Uploads is the authenticated file workflow supported by Client.
type Uploads interface {
	ListUploads(context.Context) (protocol.UploadList, error)
	UploadFiles(context.Context, []UploadFile) (protocol.UploadList, error)
	DownloadUpload(context.Context, string) ([]byte, error)
	DeleteUpload(context.Context, string) error
}

func (c *Client) ListUploads(ctx context.Context) (protocol.UploadList, error) {
	if err := c.requireWindowID(); err != nil {
		return protocol.UploadList{}, err
	}
	var list protocol.UploadList
	err := c.json(ctx, http.MethodGet, "/api/uploads", nil, http.StatusOK, &list, true)
	return list, err
}

func (c *Client) UploadFiles(ctx context.Context, files []UploadFile) (protocol.UploadList, error) {
	if err := c.requireWindowID(); err != nil {
		return protocol.UploadList{}, err
	}
	if len(files) == 0 {
		return protocol.UploadList{}, errors.New("choose at least one file")
	}
	if len(files) > MaxUploadFiles {
		return protocol.UploadList{}, fmt.Errorf("cannot upload more than %d files", MaxUploadFiles)
	}
	for _, file := range files {
		if err := validateUploadFile(file); err != nil {
			return protocol.UploadList{}, err
		}
	}

	reader, writer := io.Pipe()
	multipartWriter := multipart.NewWriter(writer)
	writerDone := make(chan error, 1)
	go func() {
		var writeErr error
		for _, file := range files {
			header := make(textproto.MIMEHeader)
			filename := strings.NewReplacer(`\`, `\\`, `"`, `\"`).Replace(file.Name)
			header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="files"; filename="%s"`, filename))
			contentType := file.Type
			if contentType == "" {
				contentType = "application/octet-stream"
			}
			header.Set("Content-Type", contentType)
			part, err := multipartWriter.CreatePart(header)
			if err != nil {
				writeErr = err
				break
			}
			if _, err = part.Write(file.Data); err != nil {
				writeErr = err
				break
			}
		}
		if err := multipartWriter.Close(); writeErr == nil {
			writeErr = err
		}
		if writeErr != nil {
			_ = writer.CloseWithError(writeErr)
		} else {
			_ = writer.Close()
		}
		writerDone <- writeErr
	}()

	resp, err := c.requestBody(ctx, http.MethodPost, "/api/uploads", reader,
		multipartWriter.FormDataContentType(), "application/json", true)
	if err != nil {
		_ = reader.CloseWithError(err)
		<-writerDone
		return protocol.UploadList{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		_ = reader.Close()
		<-writerDone
		return protocol.UploadList{}, responseError(resp)
	}
	if err := <-writerDone; err != nil {
		return protocol.UploadList{}, fmt.Errorf("write upload request: %w", err)
	}
	var list protocol.UploadList
	if err := json.NewDecoder(io.LimitReader(resp.Body, 2<<20)).Decode(&list); err != nil {
		return protocol.UploadList{}, fmt.Errorf("decode API response: %w", err)
	}
	return list, nil
}

func (c *Client) DownloadUpload(ctx context.Context, id string) ([]byte, error) {
	if err := c.requireWindowID(); err != nil {
		return nil, err
	}
	if id == "" {
		return nil, errors.New("file ID is required")
	}
	resp, err := c.request(ctx, http.MethodGet, "/api/uploads/"+urlPathSegment(id)+"/content", nil, "application/octet-stream", true)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, responseError(resp)
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, MaxUploadSize+1))
	if err != nil {
		return nil, err
	}
	if int64(len(data)) > MaxUploadSize {
		return nil, fmt.Errorf("download exceeds the %d MiB file limit", MaxUploadSize>>20)
	}
	return data, nil
}

func (c *Client) DeleteUpload(ctx context.Context, id string) error {
	if err := c.requireWindowID(); err != nil {
		return err
	}
	if id == "" {
		return errors.New("file ID is required")
	}
	resp, err := c.request(ctx, http.MethodDelete, "/api/uploads/"+urlPathSegment(id), nil, "", true)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		return responseError(resp)
	}
	return nil
}

func (c *Client) requireWindowID() error {
	c.mu.RLock()
	windowID := c.windowID
	c.mu.RUnlock()
	if windowID == "" {
		return errors.New("uploads window ID is not configured")
	}
	return nil
}

func validateUploadFile(file UploadFile) error {
	name := file.Name
	if name == "" || filepath.Base(strings.ReplaceAll(name, `\`, "/")) != name || name == "." || name == ".." {
		return errors.New("file name must be a single file name")
	}
	for _, r := range name {
		if unicode.IsControl(r) {
			return errors.New("file name cannot contain control characters")
		}
	}
	if int64(len(file.Data)) > MaxUploadSize {
		return fmt.Errorf("%s exceeds the 5 MiB file limit", name)
	}
	if file.Type != "" {
		if strings.ContainsAny(file.Type, "\r\n") {
			return errors.New("invalid file content type")
		}
		if _, _, err := mime.ParseMediaType(file.Type); err != nil {
			return fmt.Errorf("invalid content type for %s", name)
		}
	}
	return nil
}

func urlPathSegment(s string) string { return url.PathEscape(s) }
