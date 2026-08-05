# Backlog

Current product gaps (not a historical checklist). DaisyUI / HTMX-era iterations live in [`TASKS.archive.md`](./TASKS.archive.md).

## Soon

- [x] Publishable `badui` path (`bun run pack:publishable`; workspace:* rewritten on pack; client-dist in CLI)
- [x] Session / WebSocket integration tests (mount → event → patch → navigate remount → storage)
- [x] `ui.combobox` (searchable select)
- [x] Sticky client shell (avoid remounting chrome on navigate)

## Later

- [ ] Thin JS bridge (`runJavaScript` / scroll helpers)
- [ ] Composed / scatter charts
- [ ] `strict: true` on server packages
- [ ] Browser / general storage + Redis (multi-process)

## Done (recent)

- DataTable row grouping (`groupBy` / `groupToggle`)
- Sticky client shell — durable WS + sticky `app` React key; inset remounts only
- Session / WebSocket integration tests
- `ui.combobox` (searchable select)
- Tab/user storage (`ui.storage`) — not “session storage” as an open item
- Timer, markdown, html, image; real upload
- Chart zoo including radar / radial
- DataTable selection / edit
- ShadCN wires: radio, date, tooltip, accordion, avatar, skeleton, sheet, drawer
