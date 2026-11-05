package main

import (
	"flag"
	"log"
	"mime"
	"net/http"
	"time"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/api"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:4173", "HTTP listen address")
	assets := flag.String("assets", "web/dist", "directory containing built UI assets")
	flag.Parse()

	server := &http.Server{
		Addr:              *addr,
		Handler:           newHandler(api.NewServer(), *assets),
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("MyGo API listening on http://%s", *addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

func newHandler(apiHandler http.Handler, assetsDir string) http.Handler {
	_ = mime.AddExtensionType(".wasm", "application/wasm")
	mux := http.NewServeMux()
	mux.Handle("/api", apiHandler)
	mux.Handle("/api/", apiHandler)
	mux.Handle("/", http.FileServer(http.Dir(assetsDir)))
	return mux
}
