# ReUI batch 7 — form & list density

Wire-first components building on existing ShadCN client primitives.

## Batch 7

- [x] **`ui.inputGroup`** — prefix/suffix addons, optional inline action button
- [x] **`ui.toggle`** — pressed toolbar control (≠ `switch`, ≠ `toggleGroup`)
- [x] **`ui.descriptionList`** — key/value rows for detail panes
- [x] **`ui.staticTable`** — read-only HTML table for small datasets
- [x] **`ui.aspectRatio`** — fixed-ratio wrapper with child slot
- [x] **`ui.itemList`** — settings / notification rows (`item.tsx`)
- [x] **`ui.checkboxGroup`** — multi-select checkbox set

Demo: `/examples/reui-batch-7` (`ReuiBatch7Demo.ts`).

Dogfood (preferred next step over batch 8): `/examples/ops-console` — filter → feed → detail using these APIs together.

## Batch 8 (candidates)

- [ ] **`ui.dateTime`** — date + time picker
- [ ] **`ui.multiSelect`** — multi-value combobox outside DataTable
- [ ] **`ui.attachmentList`** — file chips paired with `ui.upload`
