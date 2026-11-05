# Real Clay file uploads workflow

This standalone workflow uses a Bun backend and the MyGo client in a native window or browser. It imports Clay's server, authentication, and file-persistence packages from this checkout. It does not use the fixture `mygo-api` server.

See [UPLOADS_RESULTS.md](UPLOADS_RESULTS.md) for evaluation evidence and limits.

## Build

From the repository root, enter the prototype directory:

```sh
cd prototypes/mygo
```

On Linux/amd64, bootstrap Go 1.27.1 into the user-local cache:

```sh
./scripts/bootstrap-go.sh
```

On another platform, install Go 1.27.1 from the [official downloads](https://go.dev/dl/) and set `GO_BIN` to its executable before building, for example:

```sh
export GO_BIN=/path/to/go/bin/go
```

Then build the native and browser apps:

```sh
./scripts/build-uploads.sh
```

The build creates `bin/clay-uploads` for the native app and `web/uploads-dist/` for the browser app. Bun must be available on `PATH` to run the backend.

## Start the backend

Keep the current directory at `prototypes/mygo`. In terminal 1, run:

```sh
bun workflow/server.ts --port 4175
```

The defaults are host `127.0.0.1`, port `4175`, browser assets `web/uploads-dist`, and persistent data `.data`. The server also accepts `--host`, `--port`, `--assets`, and `--data-dir` overrides.

## Open the app

For the native desktop window, use terminal 2:

```sh
./bin/clay-uploads -api http://127.0.0.1:4175
```

Alternatively, run the native app from source with `./scripts/run-uploads.sh -api http://127.0.0.1:4175`.

For the browser app, open <http://127.0.0.1:4175>. It uses the same backend and serves its page and WebAssembly assets from `web/uploads-dist`. The browser requires Web Locks and `sessionStorage`; if either is unavailable, startup displays a readable error. Unsupported browser environments were not evaluated.

## Accounts, files, and window behavior

Use either demo account: `alice` / `demo-alice` or `bob` / `demo-bob`. Each file is limited to 5 MiB. An upload request can include up to 10 files and has a 52 MiB request-body cap, including multipart overhead.

Uploaded file copies and per-user manifests persist under `.data/` by default, including across backend restarts. Sessions are kept in memory and signed with a random secret for each server start, so sign in again after restarting the backend. The per-user lifetime upload count does not decrease when files are deleted.

Files are scoped to both the signed-in user and the app window ID. A browser reload retains that tab's ID; each new tab has its own ID. Each native app instance gets a new ID. Closing a native window loses its ID, so a later instance will not list files uploaded from the closed window even though their copies and manifests remain on disk.

Browser tabs in one profile share the session cookie and are not independent user sessions. Signing in as Bob in one tab can make a stale Alice tab receive 401 and clear its protected view; the backend checks the expected user before returning protected data. Separate native app instances use separate cookie jars.
