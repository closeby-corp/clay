# MyGo Operations Desk prototype

This prototype uses MyGo's native UI renderer in a Linux window and in a browser through WebAssembly. The browser app is a canvas UI rather than a DOM component mock.

The evaluation notes below preserve the fixture-based baseline completed on 2026-10-21. Their note that the native window was not launched applies to that run. For the separate real-file Clay uploads workflow, see its [run instructions](UPLOADS.md) and [evaluation notes](UPLOADS_RESULTS.md).

## Setup

From the repository checkout root, enter the prototype directory once. The commands below assume that directory is the current working directory:

```sh
cd prototypes/mygo
./scripts/bootstrap-go.sh
```

`bootstrap-go.sh` installs checksum-verified Go 1.27.1 in a user-local cache on Linux/amd64. On other platforms, install Go 1.27.1 from the [official downloads](https://go.dev/dl/) and set `GO_BIN` to its executable, for example:

```sh
export GO_BIN=/path/to/go/bin/go
```

The scripts prefer an executable `GO_BIN`, then an optional toolchain handoff, the verified user-local Go 1.27.1 cache, and finally Go on `PATH`.

## Test and build

```sh
./scripts/test.sh
CGO_ENABLED=1 ./scripts/test.sh -race
./scripts/build.sh
```

`test.sh` runs `go test -mod=readonly ./...`. The race run requires a C compiler and a native Go toolchain with cgo support.

`build.sh` produces these artifacts:

- `bin/mygo`: stripped, trimpath native app built with cgo disabled.
- `bin/mygo-api`: the matching native API and static file server.
- `web/dist/`: browser `index.html`, `app.wasm`, and the matching Go `wasm_exec.js`.

## Run the native app

Build, then start the API server in one terminal:

```sh
./bin/mygo-api -assets web/dist
```

In another terminal, open the native window:

```sh
./bin/mygo -api http://127.0.0.1:4173
```

`./scripts/run.sh -api http://127.0.0.1:4173` is also available when you want to run the native app through `go run` instead of the built binary.

## Run in a browser

Build, then start the same API and static file server:

```sh
./bin/mygo-api -addr 127.0.0.1:4173 -assets web/dist
```

Open <http://127.0.0.1:4173>. The WebAssembly app sends API requests to the page's origin, so the UI and API share the server and browser session cookie.

## Demo accounts and data

- `alice` / `demo-alice`
- `bob` / `demo-bob`

Each account has its own seeded jobs. Accounts, sessions, jobs, and edits are in memory and reset when the API server restarts. This is prototype authentication and data, not production identity or persistence.

Browser tabs in the same profile share a session cookie; separate native app instances use separate cookie jars. Authenticated client requests include the expected user ID so a stale tab cannot silently switch to another user's session.

## UI and data

- [MyGo v0.6.0](https://github.com/egoist/mygo/tree/v0.6.0) provides the application window, UI layout, text input, focus, keyboard handling, rendering, and the WebAssembly canvas runtime.
- [Onevra source v0.2026.14](https://github.com/oneo-me/onevra/tree/source/v0.2026.14) provides the Onevra theme, themed buttons, inputs, badges, sidebar, table, Lucide icons, and line chart.
- Login, sessions, jobs, edits, and the one-second metrics event stream use the authenticated local API. Metric cards and the chart use simulated demo data.
- The form validates trimmed names, priorities 1–5, and `queued`, `running`, or `paused` before sending a request. The API validates them again.

## Evaluation notes

The final WebAssembly canvas rendered at 1280×800 and 390×844. Keyboard login with Tab and Enter worked. The Operations parent collapsed its children; ArrowRight expanded it, then ArrowDown twice and Enter opened Jobs with the active child and icon. Observe opened Live metrics.

An empty required name showed an error without sending a POST. Creating a job returned 201; editing the selected row saved the updated name, priority 3, and `running` status with PATCH 200, confirmed by GET. The live SSE chart showed throughput rising from 1 to 2. Logout returned 204, anonymous job access returned 401, and Bob saw only Bob's jobs.

At 390×844, compact navigation routed correctly, the form fields and buttons wrapped while remaining visible, and horizontal table scrolling revealed Status. Bob created a job from the narrow form. After the toolbar fix, the Workspace jobs heading stayed on one line and Edit selected, Refresh, and New job wrapped into usable rows.

Browser tabs in one profile share a session cookie, so they do not provide independent identities. In a two-tab check, Bob logging in from a stale login form in tab B revoked Alice's session; tab A's event reconnect received 401 and cleared protected data. Reload reconciled the session. Separate native cookie jars and shared-cookie behavior also passed API/client tests.

The accessibility tree exposed only a hidden unnamed textbox and no app controls; screen-reader evaluation has not passed. The browser build transfers the raw WebAssembly file, about 19.9 MB, with the current static server. The native binaries were built but not launched in an interactive window because this environment had no display server or Xvfb. GPU behavior, Windows/macOS runtime, startup time, and process memory were not measured.

This is a promising desktop-oriented prototype with working browser evaluation flows. Canvas accessibility and the initial WebAssembly payload are practical considerations. The Go API remains a separate process for authentication and business logic; fixture users, sessions, and jobs are in memory and reset when it restarts. These results support local evaluation, not a release or production-readiness claim, and make no performance-superiority claim.
