# Final integrated validation

Completed: 2026-10-21 14:08:55 UTC. The recorded checks include the selected-row toolbar fix.

## Automated checks

- `./scripts/test.sh` — passed; 23 top-level tests in 4 packages. `cmd/app` and `internal/protocol` have no test files.
- `./scripts/test.sh -race` — passed; the same 4 packages and 23 tests.
- `./scripts/build.sh` — passed with Go 1.27.1 on `linux/amd64`, `CGO_ENABLED=0`, and a `js/wasm` browser target.
- `gofmt -l` — clean for all 15 Go files.

## Browser evaluation

The actual WebAssembly canvas rendered at 1280×800 and 390×844. Tab/Enter login and keyboard navigation worked: Operations collapsed its children, ArrowRight expanded it, and ArrowDown twice plus Enter opened Jobs. Observe opened Live metrics.

An empty required name showed validation without a POST. Create returned 201. Editing the selected row saved the updated name, priority 3, and `running` status with PATCH 200; GET confirmed the saved values. The SSE chart's throughput rose from 1 to 2. Logout returned 204, anonymous job access returned 401, and Bob saw only Bob's jobs.

At 390×844, compact navigation routed, form controls wrapped and stayed visible, and horizontal table scrolling revealed Status. Bob's narrow-form create succeeded. After the toolbar fix, the Workspace jobs heading stayed on one line; Edit selected, Refresh, and New job wrapped into usable rows.

Two tabs in the same browser profile share one session cookie and do not have independent identities. When Bob logged in from a stale login form in tab B, Alice's session was replaced. Tab A's event reconnect returned 401 and cleared protected data; reloading reconciled the session. Separate native cookie jars and shared-cookie behavior also passed the race tests.

## Build artifacts

| Artifact | Path | Raw bytes | Offline gzip estimate |
|---|---|---:|---:|
| Native app | `bin/mygo` | 12,222,727 | 5,154,196 |
| Native API | `bin/mygo-api` | 6,783,136 | 2,846,377 |
| Browser WebAssembly | `web/dist/app.wasm` | 19,897,944 | 5,089,753 |

Gzip sizes are Python standard-library estimates at level 9 with mtime 0; they do not describe server configuration. The current Go static server transferred the raw WebAssembly file (19,897,944 bytes). The native app and API are separate binaries; the API is not bundled into the app.

## Assessment and limits

This is a promising desktop-oriented prototype with working browser evaluation flows. The canvas accessibility gap and substantial initial raw WebAssembly transfer are practical considerations. The browser accessibility tree exposed only a hidden unnamed textbox and no app controls, so screen-reader evaluation has not passed.

The native binaries were built but not launched in an interactive window because no display server or Xvfb was available. GPU behavior, Windows/macOS runtime, startup time, and process memory were not measured. Fixture authentication, sessions, and jobs are in memory and reset when the API restarts. The results support local evaluation; they do not claim production readiness or performance superiority.
