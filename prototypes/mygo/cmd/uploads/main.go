package main

import (
	"flag"
	"log"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/client"
	"github.com/closeby-corp/clay/prototypes/mygo/internal/uploadsapp"
	"github.com/egoist/mygo"
	"github.com/egoist/mygo/ui"
)

func main() {
	apiBase := flag.String("api", defaultAPIBase(), "uploads API base URL (browser builds use the current origin)")
	flag.Parse()

	api, err := client.New(*apiBase)
	if err != nil {
		log.Fatal(err)
	}
	if err := api.SetWindowID(uploadsapp.NewWindowID()); err != nil {
		log.Fatal(err)
	}
	state := uploadsapp.New(api)
	mygo.App.WhenReady(func() {
		window := mygo.NewWindow(mygo.WindowOptions{
			Title:     "Clay Uploads — MyGo",
			Width:     1120,
			Height:    800,
			MinWidth:  360,
			MinHeight: 520,
			Content:   ui.View(state.View),
		})
		window.OnClosed(state.Close)
		state.Start(window)
	})
	if err := mygo.App.Run(); err != nil {
		log.Fatal(err)
	}
}
