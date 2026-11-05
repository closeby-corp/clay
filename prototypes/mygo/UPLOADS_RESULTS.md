# Real-file Clay uploads evaluation

Completed 2026-10-21. These notes cover the standalone uploads workflow in [UPLOADS.md](UPLOADS.md); [RESULTS.md](RESULTS.md) remains the dated fixture-based baseline.

## Workflow evidence

The browser uploaded a README and PNG, downloaded byte-for-byte copies, and verified the copies against their source hashes. Lists are scoped to account and window ID, while the lifetime upload count is account-wide. A reload retained its ID and file list; a new or cloned tab received a distinct ID and separate Web Lock. Browser tabs share a session cookie: switching to Bob made a stale Alice request return 401 and cleared protected data. Signing Alice back in restored her files. After a backend restart, a new login recovered the persisted files and count. Confirmed deletion removed only the uploaded copy, left the source unchanged, and did not reduce the lifetime count. Cancelling the picker or delete confirmation kept files intact. An 11-file selection was rejected before reading file bytes or sending a request; a following single-file upload succeeded.

The native workflow used a real GTK file chooser to select and upload the repository README. A native Save dialog wrote a copy whose 8,288 bytes and SHA-256 matched the source. Picker and Save cancellation worked; confirmed deletion cleared the uploaded copy while the lifetime count stayed at 3. Copy-name displayed its success notice, but clipboard contents were not independently read back.

The complete native transfer workflow ran on the immediately preceding binary, before behavior-preserving helper factoring. The final-source binary matched the latest-source smoke build and passed login plus picker open/cancel; the final-source package tests passed. The full transfer path was not repeated on that binary.

Shared file commits use unique temporary siblings and rename, preserving the prior manifest if a commit fails. Delete commits metadata before best-effort blob removal, so a crash can leave an orphan blob; power-loss durability is not claimed. Native downloads also use temp-and-rename to preserve an existing destination on failure. Upload-count limits are checked before reading file bytes, and backend client limits use Bun's connection IP rather than trusting forwarded-for headers.

## Build and runtime

The final Linux/amd64 build used Go 1.27.1 with `CGO_ENABLED=0`. The native app is 12,042,503 bytes; the browser's raw WebAssembly is 19,558,119 bytes, plus a 16,992-byte `wasm_exec.js` and 879-byte HTML entry point. The Bun backend imports Clay source from this checkout and runs as a separate process; it is not bundled with the client.

Reported checks passed: 581 repository Bun tests with 1,751 assertions, 10 workflow tests with 92 assertions, and the final Go race suite with 36 top-level tests (50 including subtests) and no failures. `gofmt`, the build script, and backend bundling were clean.

An initial Linux/Xvfb run using Mesa llvmpipe software rendering mapped the native window in 168 ms and used about 118,396 KiB for the app process roughly three seconds after login. The mapping time is not startup-ready time; final workflow memory was not measured. No physical-GPU, Windows/macOS, or human-desktop polish evaluation was performed. The browser requires Web Locks and `sessionStorage`, as noted in the run instructions.

## Assessment

These results support continued desktop-client evaluation with MyGo and the existing Clay/Bun backend. The prototype still runs as two processes, and the raw browser payload and untested platform packaging limit conclusions to local evaluation. Production readiness and a total-rewrite recommendation were not evaluated.
