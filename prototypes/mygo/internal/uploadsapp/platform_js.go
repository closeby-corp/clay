//go:build js && wasm

package uploadsapp

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"strings"
	"syscall/js"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/client"
	"github.com/egoist/mygo"
)

const browserWindowKey = "clay-mygo-uploads-window-id"

func newWindowID() string {
	storage := sessionStorage()
	if storage.Type() != js.TypeObject {
		failWindowIDStartup("Clay Uploads cannot start because browser session storage is unavailable. Enable browser storage and reload.")
	}
	stored, err := readBrowserWindowID(storage)
	if err != nil {
		failWindowIDStartup("Clay Uploads cannot read browser session storage: " + err.Error())
	}
	storedID := ""
	if stored.Type() == js.TypeString && len(stored.String()) <= 80 && strings.TrimSpace(stored.String()) == stored.String() {
		storedID = stored.String()
	}

	navigator := js.Global().Get("navigator")
	if navigator.Type() != js.TypeObject {
		failWindowIDStartup("Clay Uploads cannot identify browser tabs because the Web Locks API is unavailable.")
	}
	locks := navigator.Get("locks")
	if locks.Type() != js.TypeObject || locks.Get("request").Type() != js.TypeFunction {
		failWindowIDStartup("Clay Uploads cannot identify browser tabs because the Web Locks API is unavailable.")
	}
	if storedID != "" {
		claimed, err := claimBrowserWindowID(locks, storedID)
		if err != nil {
			failWindowIDStartup("Clay Uploads could not verify browser tab ownership: " + err.Error())
		}
		if claimed {
			return storedID
		}
	}
	for {
		id := generateBrowserWindowID()
		claimed, err := claimBrowserWindowID(locks, id)
		if err != nil {
			failWindowIDStartup("Clay Uploads could not verify browser tab ownership: " + err.Error())
		}
		if claimed {
			if err := storeBrowserWindowID(storage, id); err != nil {
				failWindowIDStartup("Clay Uploads could not retain this browser tab's file list: " + err.Error())
			}
			return id
		}
	}
}

func generateBrowserWindowID() string {
	var value [16]byte
	if _, err := rand.Read(value[:]); err != nil {
		failWindowIDStartup("Clay Uploads could not generate a browser tab ID: " + err.Error())
	}
	value[6] = value[6]&0x0f | 0x40
	value[8] = value[8]&0x3f | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", value[0:4], value[4:6], value[6:8], value[8:10], value[10:16])
}

func claimBrowserWindowID(locks js.Value, id string) (acquired bool, err error) {
	defer func() {
		if recovered := recover(); recovered != nil {
			err = fmt.Errorf("%v", recovered)
		}
	}()
	type result struct {
		claimed bool
		err     error
	}
	claimed := make(chan result, 1)
	var request, reject, release js.Func
	request = js.FuncOf(func(_ js.Value, args []js.Value) any {
		if len(args) == 0 || args[0].IsNull() || args[0].IsUndefined() {
			claimed <- result{}
			return nil
		}
		executor := js.FuncOf(func(js.Value, []js.Value) any { return nil })
		hold := js.Global().Get("Promise").New(executor)
		executor.Release()
		claimed <- result{claimed: true}
		return hold
	})
	reject = js.FuncOf(func(_ js.Value, args []js.Value) any {
		message := "unknown Web Locks error"
		if len(args) > 0 {
			message = js.Global().Get("String").Invoke(args[0]).String()
		}
		claimed <- result{err: fmt.Errorf("%s", message)}
		return nil
	})
	options := js.Global().Get("Object").New()
	options.Set("ifAvailable", true)
	promise := locks.Call("request", "clay-mygo-uploads-window:"+id, options, request)
	promise.Call("catch", reject)
	outcome := <-claimed
	release = js.FuncOf(func(js.Value, []js.Value) any {
		request.Release()
		reject.Release()
		release.Release()
		return nil
	})
	js.Global().Call("setTimeout", release, 0)
	return outcome.claimed, outcome.err
}

func readBrowserWindowID(storage js.Value) (value js.Value, err error) {
	defer func() {
		if recovered := recover(); recovered != nil {
			err = fmt.Errorf("%v", recovered)
		}
	}()
	return storage.Call("getItem", browserWindowKey), nil
}

func storeBrowserWindowID(storage js.Value, id string) (err error) {
	defer func() {
		if recovered := recover(); recovered != nil {
			err = fmt.Errorf("%v", recovered)
		}
	}()
	storage.Call("setItem", browserWindowKey, id)
	return nil
}

func failWindowIDStartup(message string) {
	showWindowIDStartupError(message)
	panic(message)
}

func showWindowIDStartupError(message string) {
	defer func() { _ = recover() }()
	document := js.Global().Get("document")
	if document.Type() != js.TypeObject || document.Get("body").Type() != js.TypeObject {
		return
	}
	alert := document.Call("createElement", "div")
	alert.Set("role", "alert")
	alert.Set("tabIndex", 0)
	alert.Set("textContent", message)
	alert.Get("style").Set("cssText", "position:fixed;z-index:2147483647;inset:16px 16px auto;padding:16px;border:1px solid #fca5a5;border-radius:8px;background:#211f1c;color:#fff;font:16px/1.5 system-ui,sans-serif;box-shadow:0 4px 24px #0008")
	document.Get("body").Call("appendChild", alert)
	alert.Call("focus")
}

func sessionStorage() (value js.Value) {
	defer func() {
		if recover() != nil {
			value = js.Undefined()
		}
	}()
	return js.Global().Get("sessionStorage")
}

func pickFiles(_ *mygo.Window, done func([]LocalFile, error)) {
	document := js.Global().Get("document")
	if document.Type() != js.TypeObject {
		done(nil, errors.New("File selection is unavailable in this browser."))
		return
	}
	input := document.Call("createElement", "input")
	input.Set("type", "file")
	input.Set("accept", acceptFiles)
	input.Set("multiple", true)
	input.Get("style").Set("display", "none")
	document.Get("body").Call("appendChild", input)
	var change, cancel, release js.Func
	release = js.FuncOf(func(js.Value, []js.Value) any {
		change.Release()
		cancel.Release()
		release.Release()
		return nil
	})
	cleanup := func() {
		input.Call("remove")
		js.Global().Call("setTimeout", release, 0)
	}
	cancel = js.FuncOf(func(js.Value, []js.Value) any {
		cleanup()
		done(nil, nil)
		return nil
	})
	change = js.FuncOf(func(js.Value, []js.Value) any {
		list := input.Get("files")
		if list.Type() != js.TypeObject || list.Length() == 0 {
			cleanup()
			done(nil, nil)
			return nil
		}
		if list.Length() > client.MaxUploadFiles {
			cleanup()
			done(nil, fmt.Errorf("Choose no more than %d files.", client.MaxUploadFiles))
			return nil
		}
		files := make([]js.Value, list.Length())
		for i := range files {
			files[i] = list.Index(i)
		}
		cleanup()
		go func() {
			picked, err := readBrowserFiles(files)
			done(picked, err)
		}()
		return nil
	})
	input.Call("addEventListener", "change", change)
	input.Call("addEventListener", "cancel", cancel)
	input.Call("click")
}

func readBrowserFiles(files []js.Value) ([]LocalFile, error) {
	selected := make([]LocalFile, 0, len(files))
	for _, file := range files {
		name, contentType := file.Get("name").String(), file.Get("type").String()
		if size := file.Get("size").Int(); int64(size) > 5<<20 {
			return nil, fmt.Errorf("%s exceeds the 5 MiB file limit", name)
		}
		arrayBuffer := file.Get("arrayBuffer")
		if arrayBuffer.Type() != js.TypeFunction {
			return nil, errors.New("This browser cannot read selected files.")
		}
		result := make(chan struct {
			data []byte
			err  error
		}, 1)
		var resolve, reject js.Func
		resolve = js.FuncOf(func(_ js.Value, args []js.Value) any {
			buffer := args[0]
			view := js.Global().Get("Uint8Array").New(buffer)
			data := make([]byte, view.Get("byteLength").Int())
			js.CopyBytesToGo(data, view)
			result <- struct {
				data []byte
				err  error
			}{data: data}
			return nil
		})
		reject = js.FuncOf(func(_ js.Value, args []js.Value) any {
			result <- struct {
				data []byte
				err  error
			}{err: errors.New("could not read selected file")}
			return nil
		})
		file.Call("arrayBuffer").Call("then", resolve).Call("catch", reject)
		read := <-result
		resolve.Release()
		reject.Release()
		if read.err != nil {
			return nil, fmt.Errorf("could not read %s: %w", name, read.err)
		}
		selected = append(selected, LocalFile{Name: name, Type: contentType, Data: read.data})
	}
	return selected, nil
}

func saveDownload(ctx context.Context, _ *mygo.Window, name, contentType string, data []byte, done func(error)) {
	if err := ctx.Err(); err != nil {
		done(err)
		return
	}
	global := js.Global()
	array := global.Get("Array").New()
	bytes := global.Get("Uint8Array").New(len(data))
	js.CopyBytesToJS(bytes, data)
	array.Call("push", bytes)
	options := global.Get("Object").New()
	options.Set("type", contentType)
	blob := global.Get("Blob").New(array, options)
	url := global.Get("URL").Call("createObjectURL", blob).String()
	document := global.Get("document")
	anchor := document.Call("createElement", "a")
	anchor.Set("href", url)
	anchor.Set("download", name)
	document.Get("body").Call("appendChild", anchor)
	anchor.Call("click")
	anchor.Call("remove")
	var revoke js.Func
	revoke = js.FuncOf(func(js.Value, []js.Value) any {
		global.Get("URL").Call("revokeObjectURL", url)
		revoke.Release()
		return nil
	})
	global.Call("setTimeout", revoke, 1000)
	done(nil)
}

func copyName(name string, done func(error)) {
	navigator := js.Global().Get("navigator")
	clipboard := navigator.Get("clipboard")
	if clipboard.Type() != js.TypeObject || clipboard.Get("writeText").Type() != js.TypeFunction {
		done(errors.New("Clipboard access is unavailable in this browser."))
		return
	}
	var success, failure, release js.Func
	release = js.FuncOf(func(js.Value, []js.Value) any {
		success.Release()
		failure.Release()
		release.Release()
		return nil
	})
	finish := func(err error) {
		done(err)
		js.Global().Call("setTimeout", release, 0)
	}
	success = js.FuncOf(func(js.Value, []js.Value) any { finish(nil); return nil })
	failure = js.FuncOf(func(_ js.Value, args []js.Value) any {
		finish(errors.New("Could not copy the file name."))
		return nil
	})
	clipboard.Call("writeText", name).Call("then", success).Call("catch", failure)
}
