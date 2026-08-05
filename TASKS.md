# Backlog

Current product gaps (not a historical checklist). DaisyUI / HTMX-era iterations live in [`TASKS.archive.md`](./TASKS.archive.md).

## Soon

- [x] Publishable `badui` path (`bun run pack:publishable`; workspace:* rewritten on pack; client-dist in CLI)
- [ ] Session / WebSocket integration tests (mount → event → patch → navigate remount → storage)
- [ ] `ui.combobox` (searchable select)

## Later

- [ ] Thin JS bridge (`runJavaScript` / scroll helpers)
- [ ] Sticky client shell (avoid remounting chrome on navigate)
- [ ] DataTable row grouping
- [ ] Composed / scatter charts
- [ ] `strict: true` on server packages
- [ ] Browser / general storage + Redis (multi-process)

## Done (recent)

- Tab/user storage (`ui.storage`) — not “session storage” as an open item
- Timer, markdown, html, image; real upload
- Chart zoo including radar / radial
- DataTable selection / edit
- ShadCN wires: radio, date, tooltip, accordion, avatar, skeleton, sheet, drawer
