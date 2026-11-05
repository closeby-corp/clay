//go:build !js

package client

import (
	"net/http"
	"net/http/cookiejar"
)

func newHTTPClient() *http.Client {
	jar, _ := cookiejar.New(nil)
	return &http.Client{Jar: jar}
}
