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

- [ ] Thin JS bridge (`runJavaScript` / scroll helpers)
- [ ] Browser / client / general storage scopes + Redis adapter (multi-process / horizontal scaling)
- [ ] Compile-time reactive `let` (auto UI updates without manual `setText` / `refresh`)
- [ ] Composed / scatter charts

### Quality / DX

- [ ] `strict: true` on remaining server packages (root `tsconfig` is `"strict": false`; `@badui/core` is done)
- [ ] Light form validation (field errors, submit gate; no full schema framework required)
- [ ] Auth / trusted identity beyond anonymous `userId` (hooks on `hello` / middleware)
- [ ] Upload maturity (progress, abort, clearer size/type errors)

### Optional ShadCN wires

- [ ] Context menu, menubar, hover-card / popover, OTP, toggle group, carousel, command palette, resizable, scroll-area

### Housekeeping

- [ ] Stronger DuckDB / Kibana / ClickHouse demo integration (sidecars exist; UI story is thin)

## Done (recent)

- Re-export `reactive` / `subscribe` from `@badui/ui` (named + on `ui`)
- `strict: true` for `@badui/core` (package-local tsconfig)
- Removed retired `@badui/compiler` stub
- WebSocket auto-reconnect with backoff + reconnect toasts
- `ui.dropdownMenu` / `ui.alertDialog` / `ui.breadcrumb`; `ui.confirm` → alert dialog
- `ui.theme.set` / `ui.theme.get` + protocol `theme` op
- Client tests for `applyPatch`, reconnect backoff, optimistic helper
- Unified `ui.storage` (`tab` / `user` / `app`); removed public `GlobalState`
- Structured `ui.chart.*` / `ui.table.*` builders (additive over legacy props APIs)
- DataTable row grouping (`groupBy` / `groupToggle`)
- Sticky client shell — durable WS + sticky `app` React key; inset remounts only
- Session / WebSocket integration tests
- Publishable `badui` path (`pack:publishable` / `publish:dry`)
- `ui.combobox` (searchable select)
- Timer, markdown, html, image; real upload
- Chart zoo including radar / radial
- DataTable selection / edit
- ShadCN wires: radio, date, tooltip, accordion, avatar, skeleton, sheet, drawer
