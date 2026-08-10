# Backlog

Current product gaps (not a historical checklist). DaisyUI / HTMX-era iterations live in [`TASKS.archive.md`](./TASKS.archive.md).

## Soon

- [x] WebSocket auto-reconnect (backoff/retry in `useSession`; reconnect toast / “server restarted”)
- [x] Wire high-ROI ShadCN leftovers: dropdown menu, alert-dialog, breadcrumb (primitives already in client)
- [x] Theme / dark-mode API (`ui.theme` or similar; client already has `next-themes`)
- [x] Client test coverage (`useSession`, optimistic controls, BoundDataTable / chart smoke)
- [x] Sync `docs/concepts.md` optimistic-control list with `docs/elements.md`

## Later

### NiceGUI / scale

- [x] Thin JS bridge (`runJavaScript` / scroll helpers)
- [x] Browser / client / general storage scopes + Redis adapter (multi-process / horizontal scaling)
- [x] Compile-time reactive `let` (auto UI updates without manual `setText` / `refresh`) — Phase 1: `ui.state` + `ui.auto` (in-place props sync); Phase 2: `@clay/compiler` + `clay` Bun loader with non-leading / nested-block `let`s (see [`docs/reactive-let.md`](./docs/reactive-let.md)); NiceGUI full parity still Later
- [x] Composed / scatter charts
- [x] `ui.label(() => string)` / `Element.bindText` computed-label sugar

### Quality / DX

- [x] `strict: true` on remaining server packages (root `tsconfig` is `"strict": false`; `@clay/core` is done)
- [x] Auth / trusted identity beyond anonymous `userId` (hooks on `hello` / middleware)
- [x] Upload maturity (progress, abort, clearer size/type errors)

### Optional ShadCN wires

- [x] Context menu, hover-card / popover, OTP, toggle group
- [x] Follow-up: menubar, carousel, command palette, resizable, scroll-area

### Housekeeping

- [x] Stronger DuckDB / Kibana / ClickHouse demo integration (sidecars exist; UI story is thin)

## Done (recent)

- Reactive follow-up: `ui.auto` in-place `updateProps` when tree shape is stable; expanded `let` transform (non-leading / nested blocks / more initializers); `ui.label(() => …)` + `bindText`
- Reactive Phase 2 MVP: `@clay/compiler` transform + `clay --reactive-let` Bun loader (subset `let` → `ui.state` / `ui.auto`)
- Menubar: submenu, checkbox, radio group; command: `mode: 'inline'`
- ShadCN: menubar, carousel, command palette, resizable, scroll-area
- Reactive Phase 1: `ui.state` + `ui.auto` (tracked rebuild; see `docs/reactive-let.md`)
- Controls demo page (`/examples/controls`)
- Thin JS bridge (`ui.runJavaScript`, `ui.scroll`) + protocol ops
- Upload progress / abort / size+type errors; server `uploadMaxSizeBytes` / `uploadAccept`
- ShadCN: context menu, hover card, popover, OTP, toggle group
- Scatter + composed charts (`ui.chart.scatter` / `composed`)
- `storage.browser` / `storage.client` + `@clay/persistence-redis`
- `resolveUserId` trusted identity hook
- Package-local `strict: true` for components / server / ui
- Data clients demo page + reactive-let design stub
- Light form validation (`error` prop, `Element.setError`, `ui.validate`, FormDemo submit gate)
- Re-export `reactive` / `subscribe` from `@clay/ui` (named + on `ui`)
- `strict: true` for `@clay/core` (package-local tsconfig)
- Removed retired `@clay/compiler` stub
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
