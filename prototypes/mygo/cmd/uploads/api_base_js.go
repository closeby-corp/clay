//go:build js && wasm

package main

import "syscall/js"

func defaultAPIBase() string {
	location := js.Global().Get("location")
	if location.Type() == js.TypeObject {
		return location.Get("origin").String()
	}
	return ""
}
