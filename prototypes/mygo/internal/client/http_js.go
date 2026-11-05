//go:build js && wasm

package client

import "net/http"

func newHTTPClient() *http.Client { return &http.Client{} }
