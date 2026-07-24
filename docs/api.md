# API reference

All public APIs use **camelCase**. Import the facade from `@badui/ui` for app code.

```typescript
import { ui } from '@badui/ui';
import { reactive, subscribe, notify, navigate, GlobalState } from '@badui/core';
```

---

## `ui` facade (`@badui/ui`)

### Lifecycle

#### `ui.page(path, fn)`

Register a page builder. `fn` runs once per WebSocket session for that path.

```typescript
ui.page('/dashboard', () => {
  ui.label('Dashboard');
});
```

#### `ui.run(config?)`

Start the Bun server.

```typescript
ui.run({
  port: 4000,
  title: 'My App',
  clientDir: '/absolute/path/to/client/dist', // optional
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | `3000` | HTTP + WS port |
| `title` | `string` | `'BadUI'` | HTML `<title>` |
| `clientDir` | `string` | `packages/client/dist` | Built Vite assets |

Returns `BadUIServer` with `.start()` / `.stop()` (`.start()` is already called by `ui.run`).

#### `ui.refreshable(fn)`

Create a refreshable region. Returns `RefreshableElement` with `.refresh()`.

```typescript
const panel = ui.refreshable(() => {
  ui.label(`Items: ${items.length}`);
});
panel.refresh();
```

---

### Typography and actions

#### `ui.label(text?, props?)`

| Prop | Type | Description |
|------|------|-------------|
| `text` | `string` | Label content (also the first argument) |
| `className` | `string` | Extra classes |

#### `ui.button(text?, props?)`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | `''` | Button label |
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Visual style |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Size |
| `disabled` | `boolean` | `false` | Disabled state |
| `className` | `string` | | Extra classes |
| `onClick` | `() => void \| Promise<void>` | | Click handler |

#### `ui.link(text, href, props?)`

Client-side navigation for paths starting with `/`.

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | Extra classes |

#### `ui.badge(text?, props?)`

| Prop | Type | Default |
|------|------|---------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline'` | `'default'` |
| `color` | `string` | Named (`green`, `red`, `amber`, …) or CSS (`#22c55e`). Overrides `variant` when set. |
| `className` | `string` | |

#### `ui.alert(message?, props?)`

| Prop | Type | Default |
|------|------|---------|
| `variant` | `'default' \| 'destructive'` | `'default'` |
| `className` | `string` | |

---

### Form controls

Form controls support `bindValue(obj, key)` for two-way binding.

#### `ui.input(props?)`

| Prop | Type | Default |
|------|------|---------|
| `value` | `string` | `''` |
| `placeholder` | `string` | `''` |
| `type` | `string` | `'text'` (e.g. `email`, `number`, `color`, `password`) |
| `label` | `string` | |
| `disabled` | `boolean` | `false` |
| `className` | `string` | |
| `onInput` | `(value: string) => void` | |
| `onChange` | `(value: string) => void` | |

#### `ui.textArea(props?)`

| Prop | Type | Default |
|------|------|---------|
| `value` | `string` | `''` |
| `placeholder` | `string` | |
| `label` | `string` | |
| `rows` | `number` | `3` |
| `disabled` | `boolean` | `false` |
| `onInput` / `onChange` | `(value: string) => void` | |

#### `ui.checkbox(props?)`

| Prop | Type | Default |
|------|------|---------|
| `checked` | `boolean` | `false` (stored as element `value`) |
| `label` | `string` | |
| `disabled` | `boolean` | `false` |
| `onChange` | `(checked: boolean) => void` | |

#### `ui.select(props)`

| Prop | Type | Required |
|------|------|----------|
| `options` | `{ value: string; label: string }[]` | yes |
| `value` | `string` | defaults to first option |
| `label` | `string` | |
| `disabled` | `boolean` | |
| `onChange` | `(value: string) => void` | |

#### `ui.slider(props?)`

| Prop | Type | Default |
|------|------|---------|
| `min` | `number` | `0` |
| `max` | `number` | `100` |
| `step` | `number` | `1` |
| `value` | `number` | `0` |
| `label` | `string` | |
| `showValue` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `onChange` | `(value: number) => void` | |

---

### Data display

#### `ui.stat(items, props?)`

```typescript
ui.stat([
  { title: 'Users', value: 1234 },
  { title: 'Revenue', value: '$12k' },
]);
```

#### `ui.dataTable(data, props?)`

Server-owned table with sorting, global search, pagination, and row actions. Returns a `DataTableElement` with `setRows` / `getRows`.

`data` may be:

- an **array of objects** → one row per item; columns inferred from keys when `columns` omitted
- a **plain key-value object** → Key / Value rows (nested values are JSON-stringified)
- omitted / empty → empty table

When `keyField` is omitted, each row is stamped with an internal `__rowId` (`0..n-1`) used for actions and client keys (not shown as a column).

```typescript
ui.dataTable(tasks); // infer columns + __rowId
ui.dataTable({ host: 'localhost', port: 4000 }); // Key / Value

const table = ui.dataTable(tasks, {
  keyField: 'id',
  columns: [
    { key: 'title', header: 'Title', sortable: true },
    { key: 'status', header: 'Status' },
    { key: 'hours', header: 'Hours', align: 'right' },
  ],
  searchable: true,
  searchPlaceholder: 'Search…',
  pageSize: 8, // 0 = no pagination
  actions: [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete', variant: 'destructive' },
  ],
  onAction: (actionId, row) => {
    if (actionId === 'delete') table.setRows(tasks.filter((t) => t.id !== row.id));
  },
});
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `TableColumn[]` | inferred from data | Column defs |
| `keyField` | `string` | `'__rowId'` | Row identity for actions |
| `searchable` | `boolean` | `true` | Global filter input |
| `searchPlaceholder` | `string` | `'Search…'` | Filter placeholder |
| `columnFilterable` | `boolean` | `true` | Per-column filter row |
| `columnToggle` | `boolean` | `true` | Columns visibility menu |
| `exportable` | `boolean` | `true` | Export / copy menu (CSV, TSV, JSON) |
| `exportFilename` | `string` | `'data'` | Download base name (no extension) |
| `pageSize` | `number` | `10` | Rows per page; `0` disables pagination |
| `actions` | `DataTableAction[]` | `[]` | Per-row buttons |
| `onAction` | `(actionId, row) => void` | | Row action handler |
| `className` | `string` | | Extra classes |

| Column field | Type | Notes |
|--------------|------|-------|
| `key` | `string` | Row field / column id |
| `header` | `string` | Header label |
| `align` | `'left' \| 'right' \| 'center'` | Cell alignment |
| `sortable` | `boolean` | Default `true` |
| `value` | `(row) => unknown` | Computed scalar for sort / filter / export / default display |
| `render` | `(row) => Element \| scalar` | Optional cell UI (e.g. `ui.badge(...)`); display-only |

Server-side column callbacks (not Vue/NiceGUI slots):

```typescript
{
  key: 'status',
  header: 'Status',
  value: (row) => row.status,
  render: (row) =>
    ui.badge(String(row.status), {
      color: row.status === 'done' ? 'green' : 'amber',
    }),
},
{
  key: 'billable',
  header: 'Billable',
  value: (row) => Number(row.hours) * 50,
}
```

| Action field | Type |
|--------------|------|
| `id` | `string` |
| `label` | `string` |
| `variant` | Button variant (e.g. `destructive`, `ghost`) |

Client emits `sort` / `filter` / `columnFilter` / `columnVisibility` / `export` / `page` / `action`. Export uses filtered + sorted rows and **visible** columns only (full result set, not just the current page), then the server sends `download` or `clipboard` protocol messages. Cell `render` output is not exported — only `value` / field scalars.

#### `ui.dialog(props, fn)` / `ui.dialog(fn, props?)`

Server-owned modal overlay. Returns a `DialogElement` with `open()`, `close()`, and `setOpen(boolean)`.

```typescript
const dlg = ui.dialog({ title: 'Delete task?', open: false }, () => {
  ui.label('This cannot be undone.');
  ui.row(() => {
    ui.button('Cancel', { variant: 'outline', onClick: () => dlg.close() });
    ui.button('Delete', { variant: 'destructive', onClick: () => { /* … */ dlg.close(); } });
  });
});

dlg.open();
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | | Dialog heading |
| `open` | `boolean` | `false` | Visibility |
| `className` | `string` | | Extra classes on the panel |
| `onClose` | `() => void` | | Runs when the client emits `close` (backdrop / Escape), then `open` is set to `false` |

Client emits `close` on backdrop click or Escape. The server always clears `open` on that event.

### Imperative helpers

These require an active session (typically inside an async event handler). Confirm / prompt / choose are **async** (WebSocket round-trip). Notify is fire-and-forget.

```typescript
onClick: async () => {
  const sure = await ui.confirm('Delete this?', {
    confirmLabel: 'Delete',
    confirmVariant: 'destructive',
  });
  if (!sure) return;

  const name = await ui.prompt('Name?', { defaultValue: 'Ada' });
  if (name == null) return;

  const color = await ui.choose('Pick a color', ['Red', 'Green', 'Blue']);
  if (color == null) return;

  ui.notify(`Hello ${name} (${color})`, 'success');
  // or: ui.notify('Sticky', { type: 'warning', duration: 0, position: 'top-right' });
}
```

| Helper | Returns | Notes |
|--------|---------|-------|
| `ui.confirm(message, options?)` | `Promise<boolean>` | Cancel / Escape → `false` |
| `ui.prompt(message, options?)` | `Promise<string \| null>` | Cancel → `null` |
| `ui.choose(message, choices, options?)` | `Promise<string \| null>` | `choices` as strings or `{ value, label }` |
| `ui.notify(message, typeOrOptions?)` | `void` | Toast stack; types `info\|success\|warning\|error` |

`ui.notify` options object: `{ type?, duration?, position? }` — `duration: 0` is sticky; positions `top-left` \| `top-right` \| `bottom-left` \| `bottom-right`.

---

### Layout

All layout helpers accept either `(fn, props?)` or `(props, fn)`.

| Helper | Notes |
|--------|--------|
| `ui.row` | Horizontal flex |
| `ui.column` | Vertical flex |
| `ui.container` | Width-constrained wrapper |
| `ui.hero` | Centered hero region |
| `ui.card` | Card; callback receives the card element |

Shared layout props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gap` | `number \| string` | `2` | Tailwind-style gap scale (`0`–`8`) |
| `className` | `string` | | Extra classes |
| `centered` | `boolean` | | `mx-auto` (container) |
| `width` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| 'full'` | `'lg'` for container | Max width |

Card also accepts `title?: string`.

```typescript
ui.container(() => {
  ui.card({ title: 'Settings' }, () => {
    ui.input({ label: 'Name' });
  });
}, { centered: true, width: 'md' });
```

---

## `Element` methods (`@badui/core`)

Returned by every `ui.*` factory.

| Method | Description |
|--------|-------------|
| `.classes(...names)` | Append Tailwind/utility classes; patches `className` |
| `.style(string \| Record)` | Set inline style string / object |
| `.on(event, handler)` | Register additional event handler |
| `.setText(text)` | Set `props.text` and patch |
| `.setValue(value)` / `.set(value)` | Set `props.value` and patch |
| `.getValue()` / `.get()` | Read `props.value` |
| `.bindValue(obj, key)` | Two-way bind to reactive object property |
| `.bindTextFrom(obj, key)` | One-way bind text from object property |
| `.update(props?)` | Merge props or replace node |
| `.add(child)` | Append child element |
| `.refresh()` | **RefreshableElement only** — rebuild children |

Chaining:

```typescript
ui.label('Title')
  .classes('text-3xl', 'font-bold')
  .style({ marginBottom: '8px' });
```

---

## Reactivity (`@badui/core`)

### `reactive(target)`

```typescript
const form = reactive({ name: '', agree: false });
form.name = 'Ada'; // notifies subscribers
```

### `subscribe(obj, key, listener)`

```typescript
subscribe(form, 'name', () => {
  summary.refresh();
});
```

Returns an unsubscribe function.

### `GlobalState`

Process-wide shared state (all sessions):

```typescript
const messages = GlobalState.create<Message[]>('chatMessages', []);

messages.subscribe((list) => {
  // update UI for this session
});

messages.set([...messages.get(), newMessage]);
messages.update((prev) => [...prev, newMessage]);
```

| Method | Description |
|--------|-------------|
| `GlobalState.create(key, initial)` | Get or create named store |
| `.get()` / `.set(v)` / `.update(fn)` | Read/write |
| `.subscribe(listener)` | Listen for changes |
| `GlobalState.clearAll()` | Test helper |

---

## Helpers (`@badui/core`)

### `notify(message, typeOrOptions?)`

Toast on the client (stack). Prefer `ui.notify` from app code.

```typescript
notify('Saved!', 'success');
notify('Heads up', { type: 'warning', duration: 0, position: 'top-right' });
```

Types: `'info' | 'success' | 'warning' | 'error'`.

### `navigate(path)`

Tell the client to navigate; client reconnects WS for the new path.

---

## Direct imports

Advanced / library use:

```typescript
import {
  Element,
  RefreshableElement,
  ClientSession,
  page,
  getPage,
  getRegisteredPaths,
  reactive,
  subscribe,
  GlobalState,
  notify,
  navigate,
} from '@badui/core';

import { BadUIServer } from '@badui/server';
import { button, input /* … */ } from '@badui/components';
```
