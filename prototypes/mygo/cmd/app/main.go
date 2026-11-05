package main

import (
	"flag"
	"log"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/app"
	"github.com/closeby-corp/clay/prototypes/mygo/internal/client"
	"github.com/egoist/mygo"
	"github.com/egoist/mygo/ui"
)

func main() {
	apiBase := flag.String("api", defaultAPIBase(), "API base URL (native only; browser builds use the current origin)")
	flag.Parse()

	api, err := client.New(*apiBase)
	if err != nil {
		log.Fatal(err)
	}
	state := app.New(api)
	mygo.App.WhenReady(func() {
		window := mygo.NewWindow(mygo.WindowOptions{
			Title:     "MyGo Operations Desk",
			Width:     1220,
			Height:    820,
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
