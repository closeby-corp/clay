# Updating in place (no flicker)

Clay sends every change over one WebSocket as patches. How your server code changes the element tree decides which patches go out, and therefore what the user sees.

New data should patch what is on screen, not rebuild it.

## The rule

There are two ways to show a new value:

- **Rebuild.** You create new `ui.*` elements for the section (a new table, a new row of cards, a new list). Each new element gets a fresh id. The client receives a `setChildren` with those new ids and mounts new DOM. The old DOM is removed. Whatever lived in it is gone: scroll position, focus, what the user typed in an input, the selected row, and any enter animation runs again. The user sees a blank or jumping section.
- **Patch.** You keep the element you already have and change one prop on it, for example `label.setText(...)`. The client receives a single `updateProps` for that id, such as `{"op":"updateProps","id":"…","props":{"text":"42"}}`. The DOM node stays the same, so nothing else on the screen moves.

The flicker is caused by the remount, not by the new value. If a frame carries only the changed prop, the browser has nothing to redraw except that text.

## Pick the right tool

| Situation | API | What goes out |
|-----------|-----|---------------|
| Change one value (a label, badge, or input) | `label.setText(…)`, `el.setValue(…)`, `el.update({ … })` | `updateProps` for that element |
| Live table data | `table.setRows(rows)` on a table created with a stable `keyField` (add `highlightChanges: true` to flash changed rows) | `updateProps` on the table; rows keyed by `keyField` keep their DOM |
| Table refetch | `table.setLoading(true)` / `table.withLoading(fn)` | `updateProps` (`loading`); previous rows stay, dimmed, instead of blanking |
| A section whose structure depends on data | `ui.refreshable(() => …)` + `.refresh()`, or `ui.auto(() => …)` | Reconciled: matched children get `updateProps` only; added, removed, or reordered children cause one `setChildren` per affected parent |
| Items in a list inside either of the above | `.key(item.id)` on each item | Items keep their identity through reorder, filter, and prepend |

Use the first row whenever the shape of the screen does not change. Reach for `refreshable` or `auto` only when children really are added, removed, or reordered.

## How reconciliation matches

When a `refreshable` or `auto` block re-runs, Clay builds a fresh tree and matches it against the children already on screen:

1. **Keyed first.** A new child with `.key(k)` matches the old child with the same key and the same element type. Keyed children are matched only by key.
2. **Unkeyed by position.** Unkeyed children are matched in order, by element type. If the next old child matches the current new one, the current old child was removed and is skipped. If the current old child matches the next new one, the new child was inserted. Otherwise the pair is treated as a replacement at that position. This lookahead covers a single insert or remove; larger reshuffles should be keyed.
3. **Matched pairs keep the old element and its id.** The fresh element's handlers and props are copied onto the old one. Only props that actually changed are sent, as one `updateProps`.
4. **Leftovers.** Old children with no match are destroyed. New children with no match are mounted. The parent sends one `setChildren` only if its list of ids changed. A child whose type changed at a position is replaced; its siblings keep their ids.
5. **Nested blocks keep their instance.** A nested `refreshable` or `auto` keeps its id and its subscriptions and adopts the new builder, so its own refreshes keep working.

## Examples

### Live orders list (`ui.auto` with keys)

```ts
import { ui } from '@close-by/clay';

type Order = { id: string; customer: string; status: string; total: number };
const orders = ui.state({ list: [] as Order[], filter: '' });

ui.auto(() => {
  const shown = orders.list.filter((o) => o.status.includes(orders.filter));
  for (const o of shown) {
    ui.row(() => {
      ui.label(o.customer);
      ui.badge(o.status, { size: 'xs' });
      ui.label(`$${o.total}`);
    }).key(o.id);
  }
});

// From your feed handler. Replacing the array re-runs the block once.
// Each order keeps its element because its key is unchanged, so a
// status change is an updateProps on that row's badge.
orders.list = nextSnapshot;
```

Keys must be stable. Use the order id, not the array index or a timestamp.

### Dashboard KPI row (`setText`)

```ts
let revenue: ReturnType<typeof ui.label>;
let openCount: ReturnType<typeof ui.label>;

ui.row(() => {
  revenue = ui.label('$0').classes('text-2xl', 'font-semibold');
  openCount = ui.label('0').classes('text-2xl', 'font-semibold');
});

// Called whenever new metrics arrive. Two updateProps frames, no rebuild.
function onMetrics(m: { revenue: number; open: number }) {
  revenue.setText(`$${m.revenue.toLocaleString()}`);
  openCount.setText(String(m.open));
}
```

### Live table (`setRows` + `highlightChanges` + `setLoading`)

```ts
const table = ui.dataTable([], {
  keyField: 'id',
  highlightChanges: true,
  searchable: true,
});

// fetchOrders() is your own data call.
async function refresh() {
  await table.withLoading(async () => {
    table.setRows(await fetchOrders());
  });
}
```

`withLoading` sets loading before `fn` runs and clears it afterwards, so the previous rows stay on screen under a dimmed body until `setRows` runs. Rows whose `id` did not change keep their DOM, and changed or new rows flash.

If you want columns to stay fixed across refreshes, pass `columns` explicitly. Otherwise columns are inferred again on each `setRows`.

## Anti-patterns

- **Rebuilding a whole section when one value changes.** Wrapping a whole page in `ui.refreshable` and calling `.refresh()` every second to update a clock. Keep a reference to the clock label and call `setText`.
- **Unkeyed lists that get sorted or filtered.** Without `.key()`, position is the identity. After a sort, the element in slot 3 is reused for whatever item is now third, so focus and typed text stay in the slot instead of following the row.
- **Creating a new table instead of `setRows`.** A `ui.dataTable(...)` created inside a refreshable on every tick remounts the table and loses sort, scroll, selection, and search. Create the table once and call `setRows`.
- **Tables without `keyField`.** Rows are stamped `__rowId` by their index, so inserting or re-sorting the source shifts every row's identity. Set `keyField` to your primary key.
- **Toggling a constructor option by rebuilding.** Recreating a table with `zebra: on` inside an `auto` block. Use the setters instead: `setZebra`, `setDensity`, `setHighlightChanges`.

## Checking it works

1. **Devtools, DOM node.** Open the browser Elements panel and select a row, label, or input. Trigger an update (wait for the next feed tick or change the filter). The same node should still be selected and highlighted. For an input, click into it, let an update arrive, and confirm the caret stays. If the node is replaced, the block was rebuilt.
2. **Devtools, WebSocket frames.** Open the Network panel, filter to WS, select the connection, and watch the frames as data arrives. A value change should show `updateProps` with a small payload for one id. `setChildren` should appear only when rows are added, removed, or reordered. If an unchanged list sends `setChildren` on every tick, the child ids are changing: check that `.key()` values are stable and that the block is not creating new parent elements on each run.

## See also

- [Concepts: Updates](./concepts.md#updates-settext-vs-refreshable) for the basic `setText` vs `refreshable` split
- [API reference](./api.md) for `ui.refreshable`, `ui.auto`, `ui.dataTable`, and `Element` methods
- [Reactive `let`](./reactive-let.md) for the compile-time alternative to hand-written `ui.auto`
- [WebSocket protocol](./protocol.md) for the patch message formats
