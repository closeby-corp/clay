# API reference

All public APIs use **camelCase**. Import the facade from `@badui/ui` for app code.

```typescript
import { ui } from '@badui/ui';
import { reactive, subscribe, notify, navigate, GlobalState } from '@badui/core';
```

---

## `ui` facade (`@badui/ui`)

### Lifecycle

#### `ui.page(path, fn, options?)`

Register a page builder. `fn` runs once per WebSocket session for that path.

```typescript
ui.page('/dashboard', () => {
  ui.label('Dashboard');
});

// Opt out of the global shell from `ui.run({ app })`:
ui.page('/login', () => {
  ui.label('Sign in');
}, { shell: false });
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `shell` | `boolean` | `true` when `ui.run({ app })` is set | Set `false` to skip the global page wrapper |

#### `ui.loadPages(dir)`

Dynamically import every `*.ts` / `*.tsx` under `dir` (Bun). Each module should call `ui.page` once; optional `export const pageMeta` is attached to the path registered by that import.

Skips `index.ts(x)`, `_*` files, and `*.test.*`.

```typescript
await ui.loadPages(new URL('./pages', import.meta.url));
```

#### `ui.navFromPages()`

Build primary `AppNavItem[]` from registered routes + collected `pageMeta` (label/icon/order). Home `/` sorts first; others by `order` (default `100`) then path. Missing meta falls back to a title-cased path segment and icon `'boxes'`.

```typescript
export const pageMeta = { label: 'Charts', icon: 'chart-area', order: 90 };
```

#### `ui.run(root?, config?)`

Start the Bun server. Optional `app` sets a global shell wrapper for every page (unless `shell: false`).

**Root overload** (NiceGUI-style single page): if `/` is not registered yet, `ui.run(() => { … })` registers that function as `/` then starts.

```typescript
ui.run(() => {
  ui.label('Hello');
});
```

```typescript
await ui.loadPages(new URL('./pages', import.meta.url));

ui.run({
  port: 4000,
  title: 'My App',
  clientDir: '/absolute/path/to/client/dist', // optional
  css: './globals.css', // optional extra stylesheet(s)
  app: {
    title: 'My App',
    nav: ui.navFromPages(),
    // user, navSecondary, documents, …
  },
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | `3000` | HTTP + WS port |
| `title` | `string` | `'BadUI'` | HTML `<title>` |
| `clientDir` | `string` | `packages/client/dist` | Built Vite assets |
| `css` | `string \| string[]` | | Extra CSS file path(s) served after the client bundle (absolute or cwd-relative). Override theme tokens without rebuilding the client. |
| `app` | `AppProps` | | Global dashboard shell; wraps each page on mount |

Returns `BadUIServer` with `.start()` / `.stop()` / `.port` (`.start()` is already called by `ui.run`).

Prefer the **`badui` CLI** for prototypes: `badui hello.ts` or `badui ./pages --app` (see [Getting started](./getting-started.md)).

Custom CSS is linked as `/assets/custom-0.css`, … after `/assets/index.css`. Use **shadcn-style** theme variables (`--background`, `--primary`, `--sidebar`, `--radius`, …, plus optional `.dark { … }`). Runtime CSS cannot invent new Tailwind utility classes.

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
  {
    title: 'Total Revenue',
    value: '$1,250.00',
    trend: '+12.5%',
    footer: 'Trending up this month',
    description: 'Visitors for the last 6 months',
  },
]);
```

#### `ui.areaChart(props)`

Stacked area chart (Recharts). Optional card chrome via `title` / `description`. Set `interactive: true` with ISO date `xKey` values for 7d / 30d / 90d filtering.

```typescript
ui.areaChart({
  title: 'Total Visitors',
  description: 'Last 3 months',
  interactive: true,
  data: visitors,
  xKey: 'date',
  series: [
    { key: 'mobile', label: 'Mobile' },
    { key: 'desktop', label: 'Desktop' },
  ],
});
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
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash-2', variant: 'destructive' },
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
| `pageSizeOptions` | `number[]` | `[10, 20, 30, 40, 50]` | Footer page-size select |
| `selectable` | `boolean` | `false` | Row checkboxes + selection events |
| `reorderable` | `boolean` | `false` | Drag handle to reorder rows |
| `views` | `DataTableView[]` | | Tabbed views; each may include a row `filter` |
| `defaultView` | `string` | first view id | Initial active view |
| `onViewChange` | `(viewId) => void` | | Fires after the active view changes |
| `primaryAction` | `{ id?, label }` | | Toolbar primary button |
| `onPrimaryAction` | `() => void` | | Primary button handler |
| `detail` | `(row) => void` | | Build detached UI for the row detail drawer |
| `onReorder` | `(orderedKeys) => void` | | After drag-reorder |
| `onSelectionChange` | `(keys) => void` | | After selection changes |
| `onPageSizeChange` | `(pageSize) => void` | | After footer page-size change |
| `onCellChange` | `(rowKey, columnKey, value) => void` | | After inline editor commit |
| `actions` | `DataTableAction[]` | `[]` | Per-row actions (≤2 as buttons; more collapse into an **Actions** menu) |
| `onAction` | `(actionId, row) => void` | | Row action handler |
| `className` | `string` | | Extra classes |

| View field | Type | Notes |
|------------|------|-------|
| `id` | `string` | Tab value |
| `label` | `string` | Tab label |
| `count` | `number` | Optional badge override; otherwise derived from matching rows |
| `filter` | `(row) => boolean` | Optional display lens over source rows while this view is active |

Every view tab shows the same table chrome; switching views applies that view’s `filter` (if any) before search/column filters. Badge counts stay live after `setRows` when `count` is omitted.

| Column field | Type | Notes |
|--------------|------|-------|
| `key` | `string` | Row field / column id |
| `header` | `string` | Header label |
| `align` | `'left' \| 'right' \| 'center'` | Cell alignment |
| `sortable` | `boolean` | Default `true` |
| `value` | `(row) => unknown` | Computed scalar for sort / filter / export / default display |
| `render` | `(row) => Element \| scalar` | Optional cell UI (e.g. `ui.badge(...)`); display-only |
| `editor` | `'text' \| 'select'` | Inline editor on the client |
| `editorOptions` | `{ value, label }[]` | Options when `editor` is `'select'` |
| `detailTrigger` | `boolean` | Cell opens the row detail drawer |

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
| `icon` | Lucide name (`pencil`, `trash-2`, …) from a curated action set |
| `variant` | Button variant (e.g. `destructive`, `ghost`) |

Client emits `sort` / `filter` / `columnFilter` / `columnVisibility` / `export` / `page` / `pageSize` / `action` / `reorder` / `selectionChange` / `cellChange` / `viewChange` / `primaryAction`. Export uses filtered + sorted rows and **visible** columns only (full result set, not just the current page), then the server sends `download` or `clipboard` protocol messages. Cell `render` output is not exported — only `value` / field scalars.

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
  // or: ui.notify('Sticky', { type: 'warning', duration: 0, position: 'top-right', description: '…' });
}
```

| Helper | Returns | Notes |
|--------|---------|-------|
| `ui.confirm(message, options?)` | `Promise<boolean>` | Cancel / Escape → `false` |
| `ui.prompt(message, options?)` | `Promise<string \| null>` | Cancel → `null` |
| `ui.choose(message, choices, options?)` | `Promise<string \| null>` | `choices` as strings or `{ value, label }` |
| `ui.notify(message, typeOrOptions?)` | `void` | ShadCN Sonner toast; types `info\|success\|warning\|error` |

`ui.notify` options: `{ type?, duration?, position?, description? }` — `duration: 0` is sticky; `description` is Sonner’s secondary line; positions `top-left` \| `top-right` \| `bottom-left` \| `bottom-right`.

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
| `ui.app` | SPA shell: sidebar nav + centered main content |

#### `ui.app(props, fn)`

Sidebar layout for multi-page apps. Prefer `ui.run({ app })` so every page inherits the shell; use `ui.app` directly for advanced/one-off cases (or when `shell: false`).

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Brand label in the sidebar |
| `headerTitle` | `string` | Optional site header title (client defaults to active nav label) |
| `nav` | `AppNavItem[]` | Primary sidebar links (SPA `pushState` for `/…`) |
| `navSecondary` | `AppNavItem[]` | Optional secondary links (e.g. Settings) |
| `documents` | `AppNavItem[]` | Optional documents group |
| `user` | `AppUser` | Optional user menu (`name`, `email`, `avatar?`) |
| `variant` | `'sidebar' \| 'inset'` | Shell layout variant |
| `collapsible` | `'offcanvas' \| 'icon' \| 'none'` | Sidebar collapse behavior |
| `className` | `string` | Extra classes on the shell |

`AppNavItem`: `{ label, href, icon?, description? }` — `icon` is a curated Lucide key (e.g. `home`, `gauge`).

```typescript
// Preferred: configure once at startup
ui.run({
  app: { title: 'BadUI', nav: ui.navFromPages() },
});

// Advanced: wrap a single page manually
ui.page('/examples/counter', () => {
  ui.app(
    {
      title: 'BadUI',
      nav: [
        { label: 'Home', href: '/' },
        { label: 'Counter', href: '/examples/counter' },
      ],
    },
    () => {
      ui.label('Counter');
    },
  );
}, { shell: false });
```

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

Process-wide shared state (all sessions). Optional pluggable persistence:

```typescript
import { GlobalState } from '@badui/core';
import { createFilePersistence } from '@badui/persistence-file';

// Entrypoint — plug a backend once (file adapter ships with BadUI):
await GlobalState.configure({
  persistence: createFilePersistence({ dir: '.badui-data' }),
});

// Persists by default when an adapter is configured:
const messages = GlobalState.create<Message[]>('chatMessages', []);

// Opt out of persistence for ephemeral keys:
const online = GlobalState.create<string[]>('onlineUsers', [], { persist: false });

messages.subscribe((list) => {
  // update UI for this session
});

await messages.set([...(await messages.get()), newMessage]);
await messages.update((prev) => [...prev, newMessage]);
```

`get()` is always async. For **persisted** stores it calls `adapter.load(key)` on every read so other processes’ writes are visible; then updates memory and notifies subscribers if the value changed. `set` / `update` write memory immediately and `await adapter.save` when persisted.

| Method | Description |
|--------|-------------|
| `GlobalState.configure({ persistence })` | Set the process-wide `PersistenceAdapter` |
| `GlobalState.create(key, initial, options?)` | Get or create named store; `{ persist?: boolean }` |
| `.get()` | `Promise<T>` — load from adapter when persisted |
| `.set(v)` / `.update(fn)` | `Promise<void>` — save when persisted |
| `.subscribe(listener)` | Listen for changes |
| `GlobalState.clearAll()` | Test helper (clears stores + adapter) |
| `createMemoryPersistence()` | In-memory adapter for tests (`@badui/core`) |
| `createFilePersistence({ dir })` | File-backed adapter (`@badui/persistence-file`) |

`PersistenceAdapter`:

```typescript
type PersistenceAdapter = {
  load(key: string): Promise<string | null>;
  save(key: string, json: string): Promise<void>;
  close?(): Promise<void>;
};
```

`@badui/persistence-file` stores one JSON text file per key under `dir`. Core also provides `createMemoryPersistence()` for tests. Implement the interface yourself for Redis or other backends.

---

## Helpers (`@badui/core`)

### `notify(message, typeOrOptions?)`

Toast on the client via ShadCN Sonner. Prefer `ui.notify` from app code.

```typescript
notify('Saved!', 'success');
notify('Heads up', {
  type: 'warning',
  duration: 0,
  position: 'top-right',
  description: 'Sticky until dismissed',
});
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
  setPageWrapper,
  reactive,
  subscribe,
  GlobalState,
  createMemoryPersistence,
  notify,
  navigate,
} from '@badui/core';

import { BadUIServer } from '@badui/server';
import { button, input /* … */ } from '@badui/components';
```

---

## DuckDB (`@badui/duckdb`)

See [DuckDB](./duckdb.md) for the multi-database wrapper (`connect`, `attach`, CRUD).

## Kibana (`@badui/kibana`)

See [Kibana](./kibana.md) for REST access, Elasticsearch search via console proxy, and Saved Objects.

## ClickHouse (`@badui/clickhouse`)

See [ClickHouse](./clickhouse.md) for the multi-connection wrapper (`connect`, `query`, CRUD, `stream`).
