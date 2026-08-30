# ReUI component batches

Follow-on from batches 1–2 (timeline, stepper, dateRange, sparkline, chart chrome) and partial batch 3 (`feedList` / `feedRow`). Tracks admin-console and form-density gaps vs ReUI-style block libraries.

Source: gap analysis in chat (Aug 2026). Prefer wiring existing ShadCN client primitives before greenfield work.

## Batch 3 — Admin chrome (small, high reuse)

Ops consoles rebuild filter/toolbar rows by hand (e.g. UQ Hub Orders).

- [x] **`ui.buttonGroup`** — Segmented actions / view toggles; wire [`button-group.tsx`](packages/client/src/components/ui/button-group.tsx)
- [x] **`ui.empty`** — Empty states for tables/feeds; wire [`empty.tsx`](packages/client/src/components/ui/empty.tsx)
- [x] **`ui.pagination`** — Simple pager outside `dataTable`; wire [`pagination.tsx`](packages/client/src/components/ui/pagination.tsx)
- [x] **`ui.filterBar`** — Chip row + “clear all” + slot for `select` / `combobox` / `dateRange`

## Batch 4 — Form density (inputs++)

Common CRM/settings form gaps.

- [x] **`ui.numberField`** — Steppers, min/max, currency-friendly numeric input
- [x] **`ui.phoneInput`** — Country code + validation mask (lightweight, no libphonenumber)
- [x] **`ui.field`** — Label + description + error row; wire [`field.tsx`](packages/client/src/components/ui/field.tsx)
- [x] **`ui.nativeSelect`** — Lightweight select when combobox is overkill; wire [`native-select.tsx`](packages/client/src/components/ui/native-select.tsx)

## Batch 5 — Marketing / app shell (medium)

- [x] **`ui.navigationMenu`** — Top nav mega-menu; wire [`navigation-menu.tsx`](packages/client/src/components/ui/navigation-menu.tsx)
- [x] **`ui.stat` v2** — Optional inline sparkline per stat card (extend `StatItem` or compose with `ui.sparkline`)
- [x] **`ui.notice`** — Dismissible app-wide banner (auth expiry, maintenance)

## Batch 6 — Big ticket

- [x] **`ui.eventCalendar`** — Month grid + day event list (scheduling UX; builds on client `calendar.tsx`)
- [x] **`ui.dataTable` filter chips** — Active search/column filters as removable chips in toolbar (`views` already exist)

## Done earlier (ReUI track)

- [x] Batch 1: `ui.timeline`, `ui.stepper`, `ui.dateRange`
- [x] Batch 2: `ui.sparkline`, extended `ChartChrome`, composed ref line/area + dual axis
- [x] Batch 3 (partial): `ui.feedList`, `ui.feedRow`
- [x] Nav subitems, `pageMeta.group`, sidebar groups

## Out of scope (for now)

- More chart types (heatmap, funnel) — chart *types* are ahead of ReUI; polish is chrome + recipes
- Copy-paste ReUI block library — prefer 4–5 wire types + `docs/ops-patterns.md` recipes
- Duplicate list widgets — `list` (DnD), `feedRow` (ops feed), `dataTable` (grid) stay separate tools
