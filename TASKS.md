# Backlog

Current product gaps (not a historical checklist). DaisyUI / HTMX-era iterations live in [`TASKS.archive.md`](./TASKS.archive.md).

Source for the open items below: [clay-review.md](./clay-review.md) (UQ Hub ops dashboard on Clay 0.1.0).

## Soon — from UQ Hub feedback

### P0 — Safe defaults / correctness

- [x] **Reactive-let truly opt-in** (prerequisite for the north-star below)
  - [x] CLI: default `--no-reactive-let` (or flip so `--reactive-let` enables the Bun loader)
  - [x] Compiler: stop auto-qualifying every `ui.page` / `page` callback — only `// @clay-reactive` and `"use reactive";`
  - [x] Docs (`reactive-let.md`, getting-started): match reality; document blank-mount + CJS/`@clickhouse/client` failure modes
  - [ ] Optional: runtime/dev warning when transform rewrites files that import known-fragile packages
- [x] **Browser API boundary**
  - [x] Docs page: never use `window` / `navigator` / `location` in page code; use Clay helpers
  - [x] Document `ui.clipboard` as the copy path (and discourage `navigator.clipboard`)
  - [x] Add `ui.setUrlHash` / `ui.getUrlHash` (or session-synced query/hash helpers) — UQ Hub deep-link is a no-op today
  - [x] Add `ui.openExternal(url)` (wraps trusted `window.open` via protocol / `runJavaScript`)
  - [ ] Consider lint/types that mark DOM globals unavailable in Clay page modules

### P1 — Reactive mental model + daily DX

- [x] **Canonical reactivity recipe** (Phase 1 — explicit `state`/`auto`; stay primary until implicit `let` is solid)
  - [x] Docs: “async load → `ui.state` → wrap UI in `ui.auto`; poll with `ui.timer`”
  - [x] Decision table: `state`/`auto` vs `refreshable` vs `timer` (demote `refreshable` for new dense apps)
  - [x] Update tutorial / examples that still lead with `refreshable` as the default list pattern
- [x] **Button / icon ergonomics**
  - [x] `ui.button(label, { icon: 'copy', … })`
  - [x] `ui.iconButton({ icon, label?, … })` for toolbars
  - [x] Full Lucide set bundled in client (`packages/client/src/icons.ts`) — string keys can’t tree-shake; unknown → `boxes`
- [x] **Export public prop types** from `@close-by/clay` (`ButtonProps`, `BadgeProps`, `InputProps`, …) — apps currently use `Parameters<typeof ui.button>`
- [x] **Publish `@close-by/clay-clickhouse`** (package exists, not published) + verify Bun loader / CJS interop with reactive-let off-by-default; demo page if needed
  - Packaged + added to `scripts/publishable.ts` `PACKAGES`; run `bun run pack:publishable` / `publish:dry` / `publish:npm` to ship
  - Interop note in package README (keep reactive-let off — CLI default)

### P2 — App toolchain

- [x] **Tailwind v4 for Clay apps** (zero-config via `ui.run` / `clay`; `--no-tailwind` to opt out)
  - [x] Document recommended setup — auto scan + inject; optional tokens via `css`
  - [x] Example app — `examples/tailwind-app/` + `docs/tailwind.md`
  - [x] Clarify: runtime CSS can override tokens; app utilities come from auto scan (or `--no-tailwind` + manual build)
- [x] **CLI reload stubs**
  - [x] Write `_clay-reload-*.ts` outside the pages tree (temp/gitignored dir), or otherwise keep them out of `tsc` / app source — now under `.clay-reload/`
- [x] **CLI vs library boot contract**
  - [x] Single recommended production path; CLI as thin wrapper over the same `configureRun` / run merge — `docs/boot.md`
  - [x] Document `clientDir` so apps need not hardcode `node_modules` paths if avoidable — `resolveClayClientDir()`
  - [x] Ensure reactive-let / CSS / port do not drift between CLI and `ui.run`

### P3 — Ops-console density (nice-to-have)

- [x] Badge **size** variant (`xs`) — semantic color partly exists via `BadgeProps.color`; document it
- [x] `ui.copyButton(text)` (clipboard + notify)
- [x] `ui.externalLink` / first-class external open (related to `openExternal`)
- [x] Documented master–detail + `ui.resizable` defaults — `docs/ops-patterns.md`
- [x] Live **feed row** pattern (or primitive) — note: existing `ui.list` is grouped drag-list, not a feed
- [x] `ui.codeBlock` “sensitive” mode or docs warning for log/trace bodies that may contain secrets
- [x] Docs: promote auth session hooks + `navFromPages({ role })` for apps beyond VPN-only (API already exists)
- [x] Align `ui.ai.chat` with `state`/`auto` (or document the intentional `var` + `setMessages` exception)

## Later

### NiceGUI / scale

- [ ] **North-star: write `let`, get implicit dependency tracking** (NiceGUI-style — no manual `ui.auto` wrapping)
  - Goal UX: plain `let` in an opted-in page; Clay tracks reads/writes and rebuilds the right UI without explicit `state`/`auto` regions
  - Today’s Phase 2 transform: simple initializers → `state` + **bindText** / dependency-isolated **`auto` regions**; still opt-in, not yet the tutorial default
  - [x] Broader safe initializers (binary / template / unary / ident / property access; still no call/`new`/await; sibling-let refs abort)
  - [x] Implicit **regions** — build-time reads vs inert shell / handler-only writes; nested UI callbacks get inner regions ([`docs/reactive-let.md`](./docs/reactive-let.md))
  - [x] Dependency-isolated regions (separate `auto` when read-sets are disjoint; overlapping deps share)
  - [x] Compile-time `bindText` for `ui.label(expr)` / `label(expr)` reading state (incl. `.classes()` chains)
  - [x] Prove on Orders-shaped multi-region page — Phase 1 demo `ReactiveLetOrders` (always interactive) + let-syntax fixture/`orders-proof.test.ts`; glue locals so `const row` + dependents stay in one `auto`
  - [ ] Loop-scoped / destructured / `const` reactive bindings where safe (see `docs/reactive-let.md` Still Later)
  - [ ] Nested `auto` reuse without remounting when only inner props change
  - [ ] Docs: sell `let` as the happy path once stable; keep Phase 1 as the escape hatch for complex screens
- [x] **Investigate: `ui.jsx` / JSX trees instead of HTML strings** — writeup [`docs/jsx-investigation.md`](./docs/jsx-investigation.md)
  - Pain: `ui.html('<div…>')` is opaque (no IDE structure) and blocks real custom components; client path is `dangerouslySetInnerHTML`
  - Goal: author markup as markup (JSX) with IDE support for tags + user-defined components — not hyperscript `ui.jsx('div', props)`, and not a second UI stack
  - [x] Spike A evaluated: defer / maybe skip — prefer `ui.iframe` + Clay nodes over SSR HTML for hub cases
  - [x] Spike B: POC in `@close-by/clay-core/jsx-runtime` (`Element.adopt` + children-first reparent); pursue as north-star
  - [x] Mix with `ui.*` under same parent context — yes (documented)
  - [x] Trust model vs `ui.html(string)` documented; keep string API as escape hatch
  - [ ] Productize B: `docs/jsx.md`, re-export from `@close-by/clay`, IntrinsicElements types, demo mixing JSX + `ui.auto`
  - [ ] Phase 0 primitives to cut most strings without JSX: `ui.iframe`, status-dot / tiny circle helper
- [x] Thin JS bridge (`runJavaScript` / scroll helpers)
- [x] Browser / client / general storage scopes + Redis adapter (multi-process / horizontal scaling)
- [x] Compile-time reactive `let` MVP (Phase 1: `ui.state` + `ui.auto`; Phase 2: `@close-by/clay-compiler` + Bun loader subset — see [`docs/reactive-let.md`](./docs/reactive-let.md)); full NiceGUI parity still open above
- [x] Composed / scatter charts
- [x] `ui.label(() => string)` / `Element.bindText` computed-label sugar

### Quality / DX

- [x] `strict: true` on remaining server packages (root `tsconfig` is `"strict": false`; `@close-by/clay-core` is done)
- [x] Auth / trusted identity beyond anonymous `userId` (hooks on `hello` / middleware)
- [x] Upload maturity (progress, abort, clearer size/type errors)

### Optional ShadCN wires

- [x] Context menu, hover-card / popover, OTP, toggle group
- [x] Follow-up: menubar, carousel, command palette, resizable, scroll-area

### Housekeeping

- [x] Stronger DuckDB / Kibana / ClickHouse demo integration (sidecars exist; UI story is thin)

### Done earlier (kept for history)

- [x] WebSocket auto-reconnect (backoff/retry in `useSession`; reconnect toast / “server restarted”)
- [x] Wire high-ROI ShadCN leftovers: dropdown menu, alert-dialog, breadcrumb (primitives already in client)
- [x] Theme / dark-mode API (`ui.theme` or similar; client already has `next-themes`)
- [x] Client test coverage (`useSession`, optimistic controls, BoundDataTable / chart smoke)
- [x] Sync `docs/concepts.md` optimistic-control list with `docs/elements.md`

## Done (recent)

- Reactive follow-up: `ui.auto` in-place `updateProps` when tree shape is stable; expanded `let` transform (non-leading / nested blocks / more initializers); `ui.label(() => …)` + `bindText`
- Reactive Phase 2 MVP: `@close-by/clay-compiler` transform + `clay --reactive-let` Bun loader (subset `let` → `ui.state` / `ui.auto`)
- Menubar: submenu, checkbox, radio group; command: `mode: 'inline'`
- ShadCN: menubar, carousel, command palette, resizable, scroll-area
- Reactive Phase 1: `ui.state` + `ui.auto` (tracked rebuild; see `docs/reactive-let.md`)
- Controls demo page (`/examples/controls`)
- Thin JS bridge (`ui.runJavaScript`, `ui.scroll`) + protocol ops
- Upload progress / abort / size+type errors; server `uploadMaxSizeBytes` / `uploadAccept`
- ShadCN: context menu, hover card, popover, OTP, toggle group
- Scatter + composed charts (`ui.chart.scatter` / `composed`)
- `storage.browser` / `storage.client` + `@close-by/clay-persistence-redis`
- `resolveUserId` trusted identity hook
- Package-local `strict: true` for components / server / ui
- Data clients demo page + reactive-let design stub
- Light form validation (`error` prop, `Element.setError`, `ui.validate`, FormDemo submit gate)
- Re-export `reactive` / `subscribe` from `@close-by/clay` (named + on `ui`)
- `strict: true` for `@close-by/clay-core` (package-local tsconfig)
- Removed retired `@close-by/clay-compiler` stub
- WebSocket auto-reconnect with backoff + reconnect toasts
- `ui.dropdownMenu` / `ui.alertDialog` / `ui.breadcrumb`; `ui.confirm` → alert dialog
- `ui.theme.set` / `ui.theme.get` + protocol `theme` op
- Client tests for `applyPatch`, reconnect backoff, optimistic helper
- Unified `ui.storage` (`tab` / `user` / `app`); removed public `GlobalState`
- Structured `ui.chart.*` / `ui.table.*` builders (additive over legacy props APIs)
- DataTable row grouping (`groupBy` / `groupToggle`)
- Sticky client shell — durable WS + sticky `app` React key; inset remounts only
- Session / WebSocket integration tests
- Publishable `clay` path (`pack:publishable` / `publish:dry`)
- `ui.combobox` (searchable select)
- Timer, markdown, html, image; real upload
- Chart zoo including radar / radial
- DataTable selection / edit
- ShadCN wires: radio, date, tooltip, accordion, avatar, skeleton, sheet, drawer
