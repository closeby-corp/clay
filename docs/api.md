# API reference

All public APIs use **camelCase**. Import the facade from `@badui/ui` for app code.

```typescript
import { ui, reactive, subscribe } from '@badui/ui';
// Still available from core: import { reactive, subscribe } from '@badui/core';
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

Build primary `AppNavItem[]` from registered routes + collected `pageMeta` (label/icon/order). Home `/` sorts first; others by `order` (default `100`) then path. Missing meta falls back to a title-cased path segment and icon `'boxes'`. Set `nav: false` to register a route without a sidebar item (e.g. login/admin under Account).

```typescript
export const pageMeta = { label: 'Charts', icon: 'chart-area', order: 90 };
// export const pageMeta = { nav: false }; // route only
// export const pageMeta = { label: 'Admin', roles: ['admin'] }; // nav UX filter
```

`ui.navFromPages({ role })` / `ui.navFromPages({ roles })` hides items whose `pageMeta.roles` do not overlap (omit `roles` on meta = visible to everyone). Nav filtering is UX only — still call `requireRole` in the page builder.

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
| `app` | `AppProps` | | Global dashboard shell; client keeps chrome sticky across navigate |
| `authSecret` | `string` | | Enables signed auth cookies (`POST`/`DELETE /auth/session`), `ui.establishAuthSession` / `ui.clearAuthSession`, and default `resolveUserId` from the cookie |
| `authCookieMaxAgeSec` | `number` | `43200` (12h) | Auth cookie Max-Age |
| `sessionIdleMs` | `number` | | Optional: clear auth + redirect after this idle time |
| `sessionAbsoluteMs` | `number` | | Optional: clear auth + redirect after this time since hello |
| `sessionExpiredPath` | `string` | `'/'` | SPA path after idle/absolute expiry |
| `resolveUserId` | `(ctx) => …` | cookie helper when `authSecret` set | Trusted identity on WebSocket hello |

#### Auth cookie recipe

```typescript
ui.run({
  authSecret: process.env.BADUI_AUTH_SECRET!,
  sessionIdleMs: 30 * 60 * 1000,
  sessionAbsoluteMs: 12 * 60 * 60 * 1000,
  sessionExpiredPath: '/login',
});

// On successful login (server event handler):
ui.establishAuthSession(userId, { path: '/account' });
// → client POSTs signed token to /auth/session, then soft-reconnects so hello sees the cookie

// On logout:
ui.clearAuthSession({ path: '/login' });
```

Password hashing, login rate limits, and `requireAuth` / `requireRole` live in optional `@badui/auth`. See `/examples/auth`.

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
| `text` | `string \| (() => string)` | Label content (also the first argument). A function uses `bindText` — re-runs when tracked `state` / `reactive` reads change |
| `className` | `string` | Extra classes |

```typescript
const s = ui.state({ count: 0 });
ui.label(() => `Count: ${s.count}`);
```

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

#### `ui.spinner(props?)`

Loading indicator (Lucide spinner).

| Prop | Type |
|------|------|
| `className` | `string` |

#### `ui.skeleton(props?)`

Loading placeholder.

| Prop | Type | Default |
|------|------|---------|
| `className` | `string` | `'h-4 w-full'` |

#### `ui.avatar(props?)`

| Prop | Type | Default |
|------|------|---------|
| `src` | `string` | |
| `alt` | `string` | `''` |
| `fallback` | `string` | `'?'` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `className` | `string` | |

#### `ui.tooltip(props, fn)` / `ui.tooltip(fn, props)`

Wraps children in a ShadCN tooltip.

```typescript
ui.tooltip({ text: 'Edit item', side: 'top' }, () => {
  ui.button('', { size: 'icon', variant: 'ghost' });
});
```

| Prop | Type | Default |
|------|------|---------|
| `text` | `string` | required |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` |

#### `ui.progress(props?)`

| Prop | Type | Default |
|------|------|---------|
| `value` | `number` | `0` (0–100) |
| `className` | `string` | |

#### `ui.separator(props?)`

| Prop | Type | Default |
|------|------|---------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `className` | `string` | |

#### `ui.icon(name, props?)`

Curated Lucide icon — same key set as `AppNavItem.icon` (e.g. `home`, `gauge`, `settings`).

| Prop | Type |
|------|------|
| `className` | `string` |

#### `ui.markdown(text?, props?)`

Client renders Markdown (`marked`) and sanitizes with DOMPurify. Update with `.setText(...)`.

| Prop | Type |
|------|------|
| `className` | `string` |

#### `ui.html(html?, props?)`

Trusted server HTML into a container (same XSS trust model as NiceGUI — only pass HTML you control). Update with `.update({ html })`.

| Prop | Type |
|------|------|
| `className` | `string` |

#### `ui.image(src, props?)`

| Prop | Type | Default |
|------|------|---------|
| `alt` | `string` | `''` |
| `width` / `height` | `number \| string` | |
| `className` | `string` | |

---

### Form controls

Form controls support `bindValue(obj, key)` for two-way binding.

Optional `error?: string` on form controls shows an invalid state on the client (`aria-invalid` + message under the field). Empty/omitted means valid. Prefer `.setError()` / `ui.validate` at submit time over baking errors into the initial props.

#### `ui.input(props?)`

| Prop | Type | Default |
|------|------|---------|
| `value` | `string` | `''` |
| `placeholder` | `string` | `''` |
| `type` | `string` | `'text'` (e.g. `email`, `number`, `color`, `password`) |
| `label` | `string` | |
| `error` | `string` | |
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
| `error` | `string` | |
| `rows` | `number` | `3` |
| `disabled` | `boolean` | `false` |
| `onInput` / `onChange` | `(value: string) => void` | |

#### `ui.checkbox(props?)`

| Prop | Type | Default |
|------|------|---------|
| `checked` | `boolean` | `false` (stored as element `value`) |
| `label` | `string` | |
| `error` | `string` | |
| `disabled` | `boolean` | `false` |
| `onChange` | `(checked: boolean) => void` | |

#### `ui.switch(props?)`

Bound boolean toggle (optimistic like checkbox).

| Prop | Type | Default |
|------|------|---------|
| `checked` | `boolean` | `false` (stored as element `value`) |
| `label` | `string` | |
| `error` | `string` | |
| `disabled` | `boolean` | `false` |
| `size` | `'sm' \| 'default'` | `'default'` |
| `onChange` | `(checked: boolean) => void` | |

#### `ui.select(props)`

| Prop | Type | Required |
|------|------|----------|
| `options` | `{ value: string; label: string }[]` | yes |
| `value` | `string` | defaults to first option |
| `label` | `string` | |
| `error` | `string` | |
| `disabled` | `boolean` | |
| `onChange` | `(value: string) => void` | |

#### `ui.radioGroup(props)`

Exclusive choice (optimistic like select). Supports `bindValue`.

| Prop | Type | Required |
|------|------|----------|
| `options` | `{ value: string; label: string }[]` | yes |
| `value` | `string` | defaults to first option |
| `label` | `string` | |
| `error` | `string` | |
| `disabled` | `boolean` | |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` |
| `onChange` | `(value: string) => void` | |

#### `ui.combobox(props)`

Searchable select for large option lists (optimistic like select). Supports `bindValue`.

| Prop | Type | Required |
|------|------|----------|
| `options` | `{ value: string; label: string }[]` | yes |
| `value` | `string` | defaults to first option |
| `label` | `string` | |
| `placeholder` | `string` | `'Search…'` |
| `error` | `string` | |
| `disabled` | `boolean` | |
| `onChange` | `(value: string) => void` | |

#### `ui.date(props?)`

Calendar + popover date picker. Value is an ISO date string (`YYYY-MM-DD`). Supports `bindValue`.

| Prop | Type | Default |
|------|------|---------|
| `value` | `string` | `''` |
| `label` | `string` | |
| `placeholder` | `string` | `'Pick a date'` |
| `error` | `string` | |
| `disabled` | `boolean` | `false` |
| `onChange` | `(value: string) => void` | |

#### `ui.slider(props?)`

| Prop | Type | Default |
|------|------|---------|
| `min` | `number` | `0` |
| `max` | `number` | `100` |
| `step` | `number` | `1` |
| `value` | `number` | `0` |
| `label` | `string` | |
| `error` | `string` | |
| `showValue` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `onChange` | `(value: number) => void` | |

#### `ui.rating(props?)`

Star rating control. Supports `bindValue`.

| Prop | Type | Default |
|------|------|---------|
| `value` | `number` | `0` |
| `max` | `number` | `5` |
| `label` | `string` | |
| `error` | `string` | |
| `disabled` | `boolean` | `false` |
| `onChange` | `(value: number) => void` | |

#### `ui.colorPicker(props?)`

Hex color picker (swatches + native color input + text field). Supports `bindValue`.

| Prop | Type | Default |
|------|------|---------|
| `value` | `string` | `'#3b82f6'` |
| `label` | `string` | |
| `error` | `string` | |
| `disabled` | `boolean` | `false` |
| `onChange` | `(value: string) => void` | |

#### `ui.tags(props?)`

Multi-tag chip input. Supports `bindValue` (value is `string[]`).

| Prop | Type | Default |
|------|------|---------|
| `value` | `string[]` | `[]` |
| `options` | `{ value: string; label: string }[]` | `[]` |
| `creatable` | `boolean` | `true` |
| `label` | `string` | |
| `placeholder` | `string` | `'Add tag…'` |
| `error` | `string` | |
| `disabled` | `boolean` | `false` |
| `onChange` | `(value: string[]) => void` | |

#### `ui.codeBlock(props)`

Read-only syntax-highlighted code (Shiki on the client).

| Prop | Type | Default |
|------|------|---------|
| `code` | `string` | required |
| `language` | `string` | `'text'` |
| `showCopy` | `boolean` | `true` |

#### `ui.tree(props)`

Nested tree with selection and expand/collapse. Optimistic `selected` / `expanded`.

| Prop | Type | Default |
|------|------|---------|
| `nodes` | `{ id: string; label: string; children?: … }[]` | required |
| `selected` | `string` | `''` |
| `expanded` | `string[]` | `[]` |
| `disabled` | `boolean` | `false` |
| `onSelect` | `(id: string) => void` | |
| `onExpand` | `(expanded: string[]) => void` | |

#### `ui.editor(props?)`

Rich text editor powered by Domternal (classic toolbar + bubble menu, StarterKit). Supports `bindValue`. Wire `value` is HTML by default, or Markdown when `format: 'markdown'`. Client debounces `change` (~200ms) and flushes on blur; server echoes that match the last emitted value do not reset the caret.

| Prop | Type | Default |
|------|------|---------|
| `value` | `string` | `''` |
| `format` | `'html' \| 'markdown'` | `'html'` |
| `placeholder` | `string` | |
| `disabled` | `boolean` | `false` |
| `onChange` | `(value: string) => void` | |

#### `ui.kanban(props)`

Kanban board with cross-column card drag (`@dnd-kit`), optional swimlanes, and a card detail drawer. **`KanbanElement` owns board state** (columns + card order + selection), similar to Flow/DataTable — default settle handlers update the model and patch the client without remounting. **Do not** wrap the whole board in `ui.auto` that tracks `columns` (that remounts on every drop). Prefer side effects in `onCardMove` / `onCardSelect`.

**Owned model + defaults**

- Initial `columns` / `lanes` / `selectedCardId` seed the owned model.
- Default settle always runs (even with no user callbacks): `cardMove` → `moveCard`, `cardSelect` → `selectCard`. User `onCardMove` / `onCardSelect` run **after** for side effects only.
- Clicking a card opens the detail drawer (optimistic `selectedCardId`). Optional `detail` builds a detached Element tree stamped as `__detail` (same pattern as DataTable).
- When `lanes` is set, cards use `laneId` and drag payloads include `fromLaneId` / `toLaneId` (index is lane-scoped within the column).
- Imperative APIs: `getColumns` / `setColumns`, `getLanes` / `setLanes`, `getSelectedCardId` / `selectCard` / `clearSelection`, `moveCard`, `addCard` / `removeCard`, `addColumn` / `removeColumn`, `addLane` / `removeLane`, `setDisabled`.
- Client keeps optimistic column order while dragging; settle patches owned `columns` via `updateProps`.

```typescript
const status = ui.state({ lastMove: '', open: '' });

const board = ui.kanban({
  columns: [
    {
      id: 'todo',
      title: 'Todo',
      cards: [{ id: 'c1', title: 'Sketch API', laneId: 'eng' }],
    },
    { id: 'done', title: 'Done', cards: [] },
  ],
  lanes: [
    { id: 'eng', title: 'Engineering' },
    { id: 'design', title: 'Design' },
  ],
  detail: (card, column) => {
    ui.label(card.title);
    ui.label(column.title).classes('text-muted-foreground');
  },
  onCardMove: (p) => {
    status.lastMove = `${p.cardId} → ${p.toColumnId}`;
  },
  onCardSelect: (id) => {
    status.open = id ?? '';
  },
});

// Reset / mutate via element APIs (no outer ui.auto):
// board.setColumns([...]); board.selectCard('c1'); board.clearSelection();
```

| Prop | Type | Default |
|------|------|---------|
| `columns` | `{ id, title, cards: { id, title, description?, laneId? }[] }[]` | `[]` |
| `lanes` | `{ id, title }[]` | `[]` (no swimlanes) |
| `selectedCardId` | `string \| null` | `null` |
| `disabled` | `boolean` | `false` |
| `detail` | `(card, column) => void` | default drawer body (title/description) |
| `onCardMove` | `(payload: { cardId, fromColumnId, toColumnId, index, fromLaneId?, toLaneId? }) => void` | after owned `moveCard` |
| `onCardSelect` | `(cardId: string \| null) => void` | after owned `selectCard` |
| `onCardClick` | `(cardId: string) => void` | |

Out of v1: persistence helpers, multiplayer cursors, inline card editing forms beyond `detail`.

#### `ui.relativeTime(props)`

Multi-timezone clock (display-only). When `date` is omitted, the client ticks every second using “now”.

| Prop | Type | Default |
|------|------|---------|
| `date` | `string \| number` | live now |
| `timezones` | `(string \| { zone: string; label?: string })[]` | required |
| `dateStyle` | `'full' \| 'long' \| 'medium' \| 'short'` | `'long'` |
| `timeStyle` | `'full' \| 'long' \| 'medium' \| 'short'` | `'medium'` |
| `className` | `string` | |

#### `ui.qrCode(props)`

SVG QR code from a string (display-only; `qrcode` on the client).

| Prop | Type | Default |
|------|------|---------|
| `value` | `string` | required |
| `size` | `number` | `160` |
| `level` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` |
| `className` | `string` | |

#### `ui.imageZoom(props)`

Image with a click-to-zoom overlay. Prefer this when you want lightbox behavior; leave `ui.image` for plain `<img>`.

| Prop | Type | Default |
|------|------|---------|
| `src` | `string` | required |
| `alt` | `string` | `''` |
| `className` | `string` | |

#### `ui.list(props)`

Dense vertical grouped list with cross-group drag (`@dnd-kit`). Parallel to `ui.kanban`, but stacked groups instead of a board. **`ListElement` owns list state** (groups + item order), similar to Flow/DataTable — default settle handlers update the model and patch the client without remounting. **Do not** wrap the whole list in `ui.auto` that tracks `groups` (that remounts on every drop). Prefer side effects in `onItemMove`.

**Owned model + defaults**

- Initial `groups` seed the owned model.
- Default settle always runs (even with no user callbacks): `itemMove` → `moveItem`. User `onItemMove` runs **after** for side effects only.
- Imperative APIs: `getGroups` / `setGroups`, `moveItem`, `addItem` / `removeItem`, `addGroup` / `removeGroup`, `setDisabled`.
- Client keeps optimistic group order while dragging; settle patches owned `groups` via `updateProps`.

```typescript
const status = ui.state({ lastMove: '' });

const board = ui.list({
  groups: [
    { id: 'inbox', title: 'Inbox', items: [{ id: 'i1', title: 'Review PR' }] },
    { id: 'done', title: 'Done', items: [] },
  ],
  onItemMove: (p) => {
    status.lastMove = `${p.itemId}: ${p.fromGroupId} → ${p.toGroupId}`;
  },
});

// Reset / mutate via element APIs (no outer ui.auto):
// board.setGroups([...]); board.setDisabled(true);
```

| Prop | Type | Default |
|------|------|---------|
| `groups` | `{ id, title, items: { id, title, description? }[] }[]` | `[]` |
| `disabled` | `boolean` | `false` |
| `onItemMove` | `(payload: { itemId, fromGroupId, toGroupId, index }) => void` | after owned `moveItem` |
| `onItemClick` | `(itemId: string) => void` | |

#### `ui.imageCrop(props)`

Interactive image cropper (`react-easy-crop`). Emits `crop` with `{ dataUrl }` (JPEG data URL). No upload pipeline in v1 — POST via `ui.upload` if needed.

| Prop | Type | Default |
|------|------|---------|
| `src` | `string` | required |
| `aspect` | `number` | free crop |
| `onCrop` | `(payload: { dataUrl: string }) => void` | |
| `className` | `string` | |

#### `ui.gantt(props)`

Project timeline with sidebar row labels, month axis, bars, today + custom markers, and optional finish-to-start dependency arrows. **`GanttElement` owns timeline state** (rows + item dates + markers + dependencies), similar to Flow/DataTable — default settle handlers update the model and patch the client without remounting. **Do not** wrap the whole chart in `ui.auto` that tracks `rows` (that remounts on every drag). Prefer side effects in `onItemMove` / `onMarkerAdd`.

**Owned model + defaults**

- Initial `rows` / optional `markers` / `dependencies` / `range` seed the owned model.
- Default settle always runs (even with no user callbacks): `itemMove` → `moveItem`, `markerAdd` → `addMarker`. User `onItemMove` / `onMarkerAdd` run **after** for side effects only.
- Imperative APIs: `getRows` / `setRows`, `moveItem`, `addItem` / `removeItem`, `addRow` / `removeRow`, `getMarkers` / `setMarkers` / `addMarker` / `removeMarker`, `getDependencies` / `setDependencies` / `addDependency` / `removeDependency`, `getRange` / `setRange`, `isReadonly` / `setReadonly`.
- Drag move/resize when not `readonly` (including **cross-row** move); client keeps optimistic dates/row while dragging; settle patches owned `rows` on pointer-up.
- Double-click the month header to create a marker at that date (emits `markerAdd`), or call `addMarker` from app code.

```typescript
const status = ui.state({ lastMove: '' });

const timeline = ui.gantt({
  rows: [
    {
      id: 'design',
      title: 'Design',
      items: [{ id: 'd1', title: 'Wireframes', start: '2026-07-20', end: '2026-08-02' }],
    },
  ],
  markers: [{ id: 'beta', date: '2026-08-15', label: 'Beta' }],
  dependencies: [{ id: 'dep1', from: 'd1', to: 'd2' }],
  range: { start: '2026-07-15', end: '2026-09-05' },
  onItemMove: (p) => {
    status.lastMove = `${p.itemId} @ ${p.rowId}: ${p.start} → ${p.end}`;
  },
  onMarkerAdd: (m) => {
    console.log('marker', m);
  },
});

// Reset / mutate via element APIs (no outer ui.auto):
// timeline.setRows([...]); timeline.addMarker({ id, date, label });
// timeline.setDependencies([...]); timeline.setReadonly(true);
```

| Prop | Type | Default |
|------|------|---------|
| `rows` | `{ id, title, items: { id, title, start, end }[] }[]` | `[]` |
| `markers` | `{ id, date, label? }[]` | |
| `dependencies` | `{ id, from, to }[]` | |
| `range` | `{ start, end }` | inferred from items/markers |
| `readonly` | `boolean` | `false` |
| `onItemMove` | `(payload: { itemId, rowId, start, end }) => void` | after owned `moveItem` |
| `onItemClick` | `(itemId: string) => void` | |
| `onMarkerAdd` | `(marker: { id, date, label? }) => void` | after owned `addMarker` |

Dates are ISO `YYYY-MM-DD` (or parseable datetime strings). `dependencies` are finish-to-start links (`from` bar end → `to` bar start). Out of v1: interactive dependency editing, collision layout polish, marker drag.

#### `ui.flow(props, fn)` / `ui.flow(fn, props?)`

Interactive flow diagram backed by `@xyflow/react`. **`FlowElement` owns diagram state** (edges + node positions), similar in spirit to DataTable owning rows — DataTable-style imperative APIs mutate the model and patch the client without remounting the React Flow shell. **Node interiors are live BadUI element trees**.

**Owned model + defaults**

- Initial `edges` and each `flow.node({ position })` seed the owned model.
- Default settle handlers always run (even with no user callbacks): `nodeMove` → `moveNode`, `connect` → `addEdge`, `edgesDelete` / `nodesDelete` → remove from owned model. User `on*` handlers run **after** for side effects only.
- Imperative APIs on the returned `FlowElement`: `getEdges` / `setEdges`, `addEdge` / `removeEdges`, `moveNode`, `getPositions` / `getNodeIds`, `addNode` / `removeNode`, `group` / `addGroup`, `layout(opts?)`.
- **Do not** wrap the whole flow in `ui.auto` that tracks edges/positions — that remounts the diagram. Keep narrow `ui.auto` (or `bindText` / prop patches) **inside** individual nodes for control labels.

**Interaction model**

- Drag nodes by the card chrome (labels/empty space). Buttons, inputs, and other interactive controls are marked `nodrag` / `nopan` so clicks do not steal the drag.
- Positions stay optimistic on the client while dragging; **`nodeMove` fires once on drag-stop** and the flow persists position automatically.
- New connections emit **`connect`** once (payload includes a client-generated `id`); the flow appends that edge id so optimistic RF edges settle without remapping flicker. If ids ever diverge, BoundFlow also rematches by `source`/`target`/handles.
- Deletes (`Backspace` / `Delete`) emit **`nodesDelete`** / **`edgesDelete`** (owned model updates first). Removing a **group** also removes its `parentId` children.
- Viewport pan/zoom is client-local (not round-tripped).
- Client rebuilds RF nodes on topology changes (graph ids / handles / body child ids / parent / kind), and patches positions/edges in place when only those change.
- **`layout({ direction?, nodeWidth?, nodeHeight?, rankSep?, nodeSep?, origin?, nodes? })`** runs **dagre** (`@dagrejs/dagre`) and updates owned positions via `moveNode`. Top-level nodes are one graph; children with `parentId` get a nested pack (relative coords) inside their group.

```typescript
const status = ui.state({ lastEvent: '' });

const diagram = ui.flow(
  {
    edges: [
      {
        id: 'e1',
        source: 'a',
        target: 'b',
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'smoothstep',
        label: 'raw',
        variant: 'primary',
      },
    ],
    fitView: true,
    showMiniMap: true,
    showControls: true,
    defaultEdgeType: 'smoothstep',
    onConnect: (e) => {
      status.lastEvent = `connect ${e.source} → ${e.target}`;
    },
    onNodeMove: ({ nodeId, position }) => {
      status.lastEvent = `move ${nodeId}`;
    },
  },
  (flow) => {
    flow.node(
      {
        id: 'a',
        position: { x: 0, y: 0 },
        handles: [{ id: 'out', type: 'source', position: 'right' }],
      },
      () => {
        ui.label('Fetch');
        ui.button('Run', { onClick: () => ui.notify('ran') });
      },
    );
    flow.node(
      {
        id: 'b',
        position: { x: 280, y: 0 },
        handles: [{ id: 'in', type: 'target', position: 'left' }],
      },
      () => {
        ui.label('Transform');
      },
    );
  },
);

// Reset / mutate via element APIs (no outer ui.auto):
// diagram.setEdges([...]); diagram.moveNode('a', { x: 0, y: 0 });
// diagram.layout({ direction: 'LR' });
// diagram.addNode({ id: 'c', position: { x: 560, y: 0 } }, () => { ui.label('C'); });
```

| Prop | Type | Default |
|------|------|---------|
| `edges` | `{ id, source, target, sourceHandle?, targetHandle?, type?, label?, animated?, variant? }[]` | `[]` |
| `fitView` | `boolean` | `true` |
| `showMiniMap` | `boolean` | `true` |
| `showControls` | `boolean` | `true` |
| `defaultEdgeType` | built-in path \| custom edgeType key | |
| `defaultEdgeAnimated` | `boolean` | |
| `defaultEdgeVariant` | `'default' \| 'primary' \| 'muted' \| 'destructive'` | |
| `customNodeTypes` | `string[]` | |
| `customEdgeTypes` | `string[]` | |
| `onConnect` | `(payload: { id?, source, target, sourceHandle?, targetHandle? }) => void` | after owned `addEdge` |
| `onNodeMove` | `(payload: { nodeId, position: { x, y } }) => void` | after owned `moveNode` |
| `onNodesDelete` | `(ids: string[]) => void` | after owned `removeNode` |
| `onEdgesDelete` | `(ids: string[]) => void` | after owned `removeEdges` |
| `onSelectionChange` | `(payload: { nodeIds, edgeIds }) => void` | |

Edge `type` maps to React Flow built-in path kinds (`default` / `straight` / `step` / `smoothstep` / `simplebezier`) **or** a custom edgeType registry key. `variant` sets stroke/label colors (`primary` / `muted` / `destructive`). `label` / `animated` pass through to RF.

`flow.node(opts, fn)` options: `id` (graph id), `position`, optional `handles`, `className`, `nodeType`, `kind` (`'default' \| 'group'`), `parentId`, `width` / `height`, `extent` (`'parent'` \| `null`). When `handles` is omitted, default left-target / right-source ports are used. `kind: 'group'` (or `flow.group`) uses built-in `baduiGroup` chrome; children set `parentId` (relative positions; drag defaults to `extent: 'parent'`). Nested BadUI handlers work inside the node body. Use `flow.addNode` / `flow.addGroup` / `flow.removeNode` for runtime topology. Use `flow.layout()` for dagre packing.

**Custom React node/edge types (client registry)**

React components cannot cross the BadUI wire. Apps that customize the client register components once:

```ts
import {
  registerFlowNodeTypes,
  registerFlowEdgeTypes,
  BaduiLabeledEdge,
} from './BoundFlow'; // custom client build

registerFlowNodeTypes({ fancy: FancyNode });
registerFlowEdgeTypes({ labeled: BaduiLabeledEdge });
```

Then reference those keys from the server: `flow.node({ nodeType: 'fancy', … })` / edge `type: 'labeled'`, and optionally list them on the flow as `customNodeTypes` / `customEdgeTypes`.

See Flow Demo (`/examples/flow`) for richer patterns:

1. **ETL pipeline** — select/switch/progress/buttons inside nodes; labeled smoothstep edges + dagre auto-layout  
2. **Branching approval** — multi-handle triage (`yes` / `no` sources), rating + badges  
3. **Fan-in / fan-out + dynamic stages** — `addNode` / `removeNode` without wrapping the flow in `ui.auto`  
4. **Group nodes** — `flow.group` + `parentId` children (visual nesting / subflow containers)

Deferred: drill-in nested editing (separate canvas inside a group), ELK layouts.

#### `ui.validate(rules)`

Light submit-gate helper. Runs each rule’s `check`, calls `.setError` on the field (clears when `check` returns null/undefined), and returns `true` only if every rule passes. No schema library — keep rules explicit in the handler.

```typescript
ui.button('Save', {
  onClick: () => {
    const ok = ui.validate([
      { el: nameInput, check: () => (form.name.trim() ? null : 'Name is required') },
      { el: emailInput, check: () => (/@/.test(form.email) ? null : 'Enter a valid email') },
      { el: termsBox, check: () => (form.terms ? null : 'Accept the terms') },
    ]);
    if (!ok) {
      ui.notify('Fix the highlighted fields', 'warning');
      return;
    }
    ui.notify('Saved', 'success');
  },
});
```

| Param | Type | Description |
|-------|------|-------------|
| `rules` | `{ el: Element; check: () => string \| null \| undefined }[]` | One entry per field |

Also available as `validate` from `@badui/core` / `@badui/ui`.

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

Stacked area chart (Recharts). Optional card chrome via `title` / `description`. Set `interactive: true` with ISO date `xKey` values for 7d / 30d / 90d filtering. Legend is always shown. Pass `stacked: false` to overlay series instead of stacking (default `true`).

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

#### `ui.barChart(props)`

Bar chart with the same cartesian props as area (`data`, `xKey`, `series`, title/description/height/interactive). Optional `stacked` (default `false`) and `layout: 'vertical' | 'horizontal'` (default `'vertical'` — category on X).

```typescript
ui.barChart({
  title: 'Desktop vs mobile',
  data: monthly,
  xKey: 'month',
  series: [
    { key: 'mobile', label: 'Mobile' },
    { key: 'desktop', label: 'Desktop' },
  ],
  stacked: true,
  layout: 'horizontal',
});
```

#### `ui.lineChart(props)`

Line chart with the same cartesian props as area (including interactive date ranges).

```typescript
ui.lineChart({
  title: 'Traffic trend',
  data: monthly,
  xKey: 'month',
  series: [
    { key: 'mobile', label: 'Mobile' },
    { key: 'desktop', label: 'Desktop' },
  ],
});
```

#### `ui.pieChart(props)`

Pie or donut chart. Pass either row-wise `nameKey` + `valueKey`, or `series` over a single aggregated row. Set `innerRadius` for a donut. Legend is always shown.

```typescript
ui.pieChart({
  title: 'Browser share',
  data: [
    { browser: 'Chrome', visitors: 275 },
    { browser: 'Safari', visitors: 200 },
  ],
  nameKey: 'browser',
  valueKey: 'visitors',
});

ui.pieChart({
  title: 'Traffic mix',
  innerRadius: 60,
  data: [{ mobile: 320, desktop: 480 }],
  series: [
    { key: 'mobile', label: 'Mobile' },
    { key: 'desktop', label: 'Desktop' },
  ],
});
```

#### `ui.radarChart(props)`

Radar (spider) chart. Pass `angleKey` for polar categories and `series` for each polygon. Optional `fillOpacity` (default `0.6`).

```typescript
ui.radarChart({
  title: 'Desktop vs mobile',
  data: monthly,
  angleKey: 'month',
  series: [
    { key: 'mobile', label: 'Mobile' },
    { key: 'desktop', label: 'Desktop' },
  ],
});
```

#### `ui.radialChart(props)`

Radial bar chart. Pass either row-wise `nameKey` + `valueKey`, or `series` over a single row (stacked segments). Optional `innerRadius` / `outerRadius`, `startAngle` / `endAngle`, and `centerValue` / `centerLabel` for the ShadCN radial-text pattern.

```typescript
ui.radialChart({
  title: 'Browser share',
  data: [
    { browser: 'Chrome', visitors: 275 },
    { browser: 'Safari', visitors: 200 },
  ],
  nameKey: 'browser',
  valueKey: 'visitors',
});

ui.radialChart({
  title: 'Traffic mix',
  endAngle: 180,
  centerValue: 800,
  centerLabel: 'Visitors',
  data: [{ mobile: 320, desktop: 480 }],
  series: [
    { key: 'mobile', label: 'Mobile' },
    { key: 'desktop', label: 'Desktop' },
  ],
});
```

#### Structured charts (`ui.chart`)

Optional sugar over the props APIs above. Mode-first builders compile to the same `Element` types — legacy `ui.areaChart` / `ui.pieChart` / etc. remain fully supported.

| Entry | Purpose | Compiles to |
|-------|---------|-------------|
| `ui.chart.categories(data)` | Cartesian (category axis) | `areaChart` / `barChart` / `lineChart` |
| `ui.chart.timeSeries(data)` | ISO-date x-axis + 7d/30d/90d filter | `areaChart` / `lineChart` with `interactive: true` |
| `ui.chart.pie.fromRows(data, keys)` | Many rows, label/value fields | `pieChart` with `nameKey`/`valueKey` |
| `ui.chart.pie.fromMetrics(row, series)` | One aggregated row | `pieChart` with `series` |
| `ui.chart.radial.fromRows(data, keys)` | Multi-row radial bars | `radialChart` with `nameKey`/`valueKey` |
| `ui.chart.radial.stackedGauge(row, series, gauge)` | Gauge recipe | `radialChart` with bundled defaults |
| `ui.chart.radar(data, angleKey)` | Polar categories | `radarChart` |

```typescript
ui.chart.categories(monthly)
  .x('month')
  .series(['mobile', 'desktop']) // shorthand → { key, label }
  .area({ title: 'Traffic', stacked: true });

ui.chart.timeSeries(visitors).x('date').series(series).area({ title: 'Visitors' });

ui.chart.pie.fromRows(rows, { name: 'browser', value: 'visitors' }).title('Share').build();
ui.chart.pie.fromMetrics({ mobile: 320, desktop: 480 }, series).donut(60);

ui.chart.radial.stackedGauge(
  { mobile: 320, desktop: 480 },
  series,
  {
    center: { value: 800, label: 'Visitors' },
    arc: { end: 180 },
    radius: { inner: 80, outer: 110 },
  },
);

ui.chart.radar(monthly, 'month').series(series).title('Skills').build();
```

#### `ui.dataTable(data, props?)`

Server-owned table with sorting, global search, pagination, and row actions. Returns a `DataTableElement` with `setRows` / `getRows` / `getQuery` (`DataTableQuery`: `{ page, pageSize, filter, columnFilters, sorts }`) / `getPage` / `getPageSize` / `getFilter` / `getColumnFilters` / `setLoading` / `withLoading` / `setTotalRows` / `getTotalRows` / `setDensity` / `setZebra` / `setSorts` / `getSorts`.

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
| `columnFilterable` | `boolean` | `true` | Per-column filters (text row and/or facet popovers) |
| `columnToggle` | `boolean` | `true` | Columns visibility menu |
| `exportable` | `boolean` | `true` | Export / copy menu (CSV, TSV, JSON) |
| `exportFilename` | `string` | `'data'` | Download base name (no extension) |
| `loading` | `boolean` | `false` | Show a spinner in the table body (takes precedence over empty). `setLoading` / `withLoading` toggle it |
| `emptyTitle` | `string` | `'No rows'` | Empty-state title (only when not loading and rows are empty) |
| `emptyDescription` | `string` | search/filter hint | Empty-state description (only when not loading and rows are empty) |
| `pageSize` | `number` | `10` | Rows per page; `0` disables pagination |
| `pageSizeOptions` | `number[]` | `[10, 20, 30, 40, 50]` | Footer page-size select |
| `manualPagination` | `boolean` | `false` | Treat `data` / `setRows` as the **current page**; skip local filter/sort/group/slice; use `totalRows` for the pager. Forces `manualFiltering` + `manualSorting` |
| `manualFiltering` | `boolean` | `false` | Skip local search/column filters; keep filter state and emit `filter` / `columnFilter` (+ callbacks). Always on when `manualPagination` is set; alone = hybrid (local sort/page still run) |
| `manualSorting` | `boolean` | `false` | Skip local sort; keep `sorts` and emit `sort` (+ `onSortChange`). Always on when `manualPagination` is set; alone = hybrid (local filter/page still run) |
| `totalRows` | `number` | | Total count across pages when `manualPagination` is true (`setTotalRows` / `getTotalRows`) |
| `defaultSorts` | `DataTableSort[]` | `[]` | Initial ordered multi-sort (`{ key, dir }[]`). Mirrored as `sortKey` / `sortDir` from the first entry |
| `density` | `'compact' \| 'default' \| 'comfortable'` | `'default'` | Row / cell spacing (`setDensity`) |
| `zebra` | `boolean` | `false` | Alternate-row striping (`setZebra`) |
| `selectable` | `boolean` | `false` | Row checkboxes + selection events |
| `reorderable` | `boolean` | `false` | Drag handle to reorder rows (global order; page slice updates relative order without scrambling off-page rows). Works with row virtualization: only mounted rows are drop targets — drag near the scroll edge to window more rows |
| `groupBy` | `string \| (row) => unknown` | | Partition rows into collapsible groups (column key or derived value). Ignored when `manualPagination` is true |
| `defaultCollapsed` | `boolean` | `false` | Start with every group collapsed (client-owned) |
| `onGroupToggle` | `(groupKey, collapsed) => void` | | After a group header is expanded/collapsed |
| `views` | `DataTableView[]` | | Tabbed views; each may include a row `filter` |
| `defaultView` | `string` | first view id | Initial active view |
| `onViewChange` | `(viewId) => void` | | Fires after the active view changes |
| `primaryAction` | `{ id?, label }` | | Toolbar primary button |
| `onPrimaryAction` | `() => void` | | Primary button handler |
| `detail` | `(row) => void` | | Build detached UI for the row detail drawer |
| `onReorder` | `(orderedKeys) => void` | | After drag-reorder (receives the reordered page-slice keys) |
| `onSelectionChange` | `(keys) => void` | | After selection changes |
| `onPageChange` | `(page) => void` | | After footer page change. Remote: refetch (`getQuery()`) |
| `onPageSizeChange` | `(pageSize) => void` | | After footer page-size change (page → 1). Remote: refetch |
| `onSortChange` | `(sorts) => void` | | After sort changes. Remote: refetch with `sorts` |
| `onFilterChange` | `(filter) => void` | | After global search (page → 1). Remote: refetch |
| `onColumnFilterChange` | `(filters) => void` | | After column filters change (full map; page → 1). Remote: refetch |
| `onCellChange` | `(rowKey, columnKey, value) => void` | | After inline editor commit |
| `actions` | `DataTableAction[]` | `[]` | Per-row actions — always shown in a **⋯** overflow menu |
| `onAction` | `(actionId, row) => void` | | Row action handler |
| `bulkActions` | `DataTableAction[]` | `[]` | Toolbar actions for the current selection (requires `selectable`) |
| `onBulkAction` | `(actionId, rowKeys) => void` | | Bulk action handler |
| `className` | `string` | | Extra classes |

**Remote / server-paged contract** (`manualPagination: true`):

| | Table does | App must |
|--|------------|----------|
| Rows | Treats `data` / `setRows` as the **current page** (no local filter/sort/group/slice) | Fetch the page and call `setRows` |
| Totals | Pager uses `totalRows` / `setTotalRows` (`getTotalRows`) | Return the full matching count from the server |
| Chrome state | Keeps `page`, `pageSize`, `filter`, `columnFilters`, `sorts` in props; `getQuery()` snapshots them | Apply that query on the server |
| Events | Emits `page` / `pageSize` / `filter` / `columnFilter` / `sort` and the `on*` callbacks below (filter/sort/pageSize reset `page` to 1) | Refetch on each change |
| Loading / empty | `loading` shows a body spinner and **hides** empty; `emptyTitle` / `emptyDescription` only when settled empty | `setLoading(true)` **before** await (keep previous rows), then `setRows` + `setTotalRows`, then `setLoading(false)` — or use `withLoading` |

| Event / callback | Payload | App should |
|------------------|---------|------------|
| `page` / `onPageChange` | page number, or `{ page }` | Fetch that page, `setRows` |
| `pageSize` / `onPageSizeChange` | page size (or `{ pageSize }`) | Reset page, fetch, `setRows` + `setTotalRows` |
| `filter` / `onFilterChange` | search string | Reset page, fetch with query |
| `columnFilter` / `onColumnFilterChange` | `{ key, value }` / full `filters` map | Reset page, fetch with filters |
| `sort` / `onSortChange` | `{ key, dir?, multi? }` or `{ sorts }` / `DataTableSort[]` | Reset page, fetch with `sorts` |

Hybrid mode: set `manualFiltering` and/or `manualSorting` **without** `manualPagination` to skip only those local stages while still paging locally. Export uses the current page rows only when `manualPagination` is true. Footer aggregates (`column.aggregate`) run over the **filtered** row set locally, or over the **provided / current-page** rows when `manualPagination` is true. Facet option `count`s in remote mode are derived from the supplied page unless you pass `facetOptions` with server-computed counts.

**Client chrome** (renderer behavior; no server API): column headers are resizable (drag the right edge). Sortable headers show a tooltip (`Click to sort · Shift+click for multi-sort`); Shift+click adds/toggles multi-sort, and active sorts show priority badges when more than one column is sorted. Header ⋯ / pin controls expose pin left/right/clear (and an aggregate hint when `column.aggregate` is set); pin state is reflected in `aria-label` / `aria-pressed`. Footer aggregate cells announce via `aria-label` plus a polite live region. Inline editors: text/number/date — **Enter** commits, **Esc** cancels (blur still commits); select/boolean commit on change (**Esc** restores focus). Row virtualization kicks in when body items ≥ **40** (including when `reorderable` is true). With reorder + virtualization, only windowed rows are active drop targets — use drag auto-scroll near the viewport edge to reach farther rows.

| View field | Type | Notes |
|------------|------|-------|
| `id` | `string` | Tab value |
| `label` | `string` | Tab label |
| `count` | `number` | Optional badge override; otherwise derived from matching rows |
| `filter` | `(row) => boolean` | Optional display lens over source rows while this view is active |

Every view tab shows the same table chrome; switching views applies that view’s `filter` (if any) before search/column filters. Badge counts stay live after `setRows` when `count` is omitted.

When `groupBy` is set, filter/sort run first, then rows are stably partitioned so each group is contiguous. The client renders collapsible group headers plus **Collapse all** / **Expand all** in the toolbar (collapse state is client-owned, like selection); `onGroupToggle` fires for app logic. Empty group values show as `(Empty)`.

| Column field | Type | Notes |
|--------------|------|-------|
| `key` | `string` | Row field / column id |
| `header` | `string` | Header label |
| `align` | `'left' \| 'right' \| 'center'` | Cell alignment |
| `sortable` | `boolean` | Default `true` |
| `filter` | `'text' \| 'facet'` | Default text substring in the filter row; `'facet'` is multi-select exact match in a header popover |
| `facetOptions` | `{ value, label }[]` | Facet choices; when set without `filter`, implies `filter: 'facet'`. When omitted with `filter: 'facet'`, distinct values are derived. Server adds live `count`s. |
| `value` | `(row) => unknown` | Computed scalar for sort / filter / export / default display |
| `render` | `(row) => Element \| scalar` | Optional cell UI (e.g. `ui.badge(...)`); display-only |
| `editor` | `'text' \| 'select' \| 'number' \| 'date' \| 'boolean'` | Inline editor on the client (`number` commits a finite number; `date` ISO `YYYY-MM-DD`; `boolean` a switch). Text/number/date: Enter commits, Esc cancels; select/boolean commit on change (Esc restores focus) |
| `editorOptions` | `{ value, label }[]` | Options when `editor` is `'select'` |
| `detailTrigger` | `boolean` | Cell opens the row detail drawer |
| `aggregate` | `'sum' \| 'avg' \| 'count' \| 'min' \| 'max' \| (rows, col) => unknown` | Footer total for this column (filtered rows locally; provided/current-page rows when `manualPagination`). Announced in the footer / live region |
| `pin` | `'left' \| 'right'` | Sticky column while scrolling horizontally (header ⋯ menu can change this at runtime; pin control exposes current state to AT) |

Facet filters store selected values as a JSON string array in `columnFilters[key]` (e.g. `'["todo","done"]'`). Text columns keep substring filters in the denser filter row; facet-only tables skip that row and filter from the header popover.

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

Client emits `sort` / `filter` / `columnFilter` / `columnVisibility` / `columnPin` / `export` / `page` / `pageSize` / `action` / `bulkAction` / `reorder` / `selectionChange` / `cellChange` / `viewChange` / `groupToggle` / `primaryAction`. `page` accepts a page number or `{ page }`. `pageSize` accepts a number or `{ pageSize }`. `sort` payload is `{ key, dir?, multi? }` or `{ sorts }` (full ordered list). `bulkAction` payload is `{ actionId, rowKeys }`. `columnPin` payload is `{ key, pin: 'left' \| 'right' \| null }`. Export uses filtered + sorted rows and **visible** columns only (full result set, not just the current page — except in `manualPagination` mode, where export is the current page), then the server sends `download` or `clipboard` protocol messages. Cell `render` output is not exported — only `value` / field scalars.

#### Structured tables (`ui.table`)

Optional sugar over `ui.dataTable`. Staged methods bundle related props; `.build()` calls `dataTable(data, props)` and returns the same `DataTableElement`. Legacy props APIs remain supported.

| Method | Bundles |
|--------|---------|
| `.id(keyField)` | `keyField` |
| `.columns(cols)` | `columns` |
| `.search(placeholder?)` | `searchable: true`, `searchPlaceholder` |
| `.pageSize(n, options?)` | `pageSize`, `pageSizeOptions` |
| `.manualPagination(totalRows?)` | `manualPagination: true`, optional `totalRows` (forces remote filter/sort) |
| `.manualFiltering(enabled?)` | `manualFiltering` (default `true`; hybrid without `.manualPagination()`) |
| `.manualSorting(enabled?)` | `manualSorting` (default `true`; hybrid without `.manualPagination()`) |
| `.density(value)` | `density` |
| `.zebra(enabled?)` | `zebra` (default `true`) |
| `.groupBy(key, opts?)` | `groupBy`, `defaultCollapsed` |
| `.views(items, defaultId?)` | `views`, `defaultView` |
| `.rowActions(actions, onAction)` | `actions`, `onAction` |
| `.primaryAction(action \| label, onPrimaryAction?)` | `primaryAction`, `onPrimaryAction` |
| `.bulkActions(actions, onBulkAction)` | `bulkActions`, `onBulkAction`, `selectable: true` |
| `.detail(fn)` | `detail` (use `detailTrigger` on columns) |
| `.selectable(onChange?)` | `selectable`, `onSelectionChange` |
| `.reorderable(onReorder?)` | `reorderable`, `onReorder` |
| `.export(filename?)` | `exportable: true`, `exportFilename` |
| `.build()` | returns `DataTableElement` |

```typescript
ui.table(tasks)
  .id('id')
  .columns([...])
  .search('Search tasks…')
  .groupBy('status')
  .pageSize(8, { options: [5, 8, 10, 20] })
  .density('compact')
  .zebra()
  .rowActions(actions, handleAction)
  .primaryAction('Add task', () => { /* … */ })
  .bulkActions(
    [{ id: 'archive', label: 'Archive' }],
    (actionId, rowKeys) => { /* … */ },
  )
  .build();
```

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

#### `ui.dialogStack(props, fn)` / `ui.dialogStack(fn, props?)`

Server-owned stacked multi-step modal. Returns a `DialogStackElement` with `open()`, `close()`, `setOpen(boolean)`, and `setIndex(number)`. Children are steps via `stack.step({ title? }, fn)`.

```typescript
const wizard = ui.dialogStack({ title: 'Onboarding', open: false, index: 0 }, (stack) => {
  stack.step({ title: 'Account' }, () => {
    ui.input({ label: 'Email' });
  });
  stack.step({ title: 'Confirm' }, () => {
    ui.button('Done', { onClick: () => wizard.close() });
  });
});

wizard.open();
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | | Stack-level heading (fallback when a step has no title) |
| `open` | `boolean` | `false` | Visibility |
| `index` | `number` | `0` | Active step index (clamped to step count) |
| `className` | `string` | | Extra classes on the active panel |
| `onClose` | `() => void` | | Runs when the client emits `close`, then `open` is set to `false` |
| `onIndexChange` | `(index: number) => void` | | Runs when the client emits `indexChange`, then `index` is updated |

Client emits `close` (backdrop / Escape / close button) and `indexChange` (Back / Next / step dots). The server owns `open` and `index`.

#### `ui.alertDialog(props?)`

Server-owned confirm / destructive modal. Returns an `AlertDialogElement` with `open()`, `close()`, and `setOpen(boolean)`.

```typescript
const danger = ui.alertDialog({
  title: 'Delete item?',
  description: 'This cannot be undone.',
  confirmLabel: 'Delete',
  confirmVariant: 'destructive',
  onConfirm: () => { /* … */ },
});
danger.open();
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | | Heading |
| `description` | `string` | | Body copy |
| `confirmLabel` | `string` | `'OK'` | Confirm button |
| `cancelLabel` | `string` | `'Cancel'` | Cancel button |
| `confirmVariant` | button variant | `'default'` | Confirm button style |
| `open` | `boolean` | `false` | Visibility |
| `onConfirm` | `() => void` | | Confirm click |
| `onClose` | `() => void` | | Cancel / Escape / backdrop |

`ui.confirm(...)` uses this element under the hood.

#### `ui.dropdownMenu(props, fn)` / `ui.dropdownMenu(fn, props?)`

ShadCN dropdown. Children: `m.item(value, label, opts?)` and `m.separator()`.

```typescript
ui.dropdownMenu({ label: 'Actions', variant: 'outline' }, (m) => {
  m.item('edit', 'Edit', { onSelect: () => {} });
  m.separator();
  m.item('delete', 'Delete', { variant: 'destructive', onSelect: () => {} });
});
```

#### `ui.breadcrumb(items, props?)`

```typescript
ui.breadcrumb([
  { label: 'Home', href: '/' },
  { label: 'Settings' },
]);
```

Items with `href` use SPA `pushState` (same as `ui.link`). The last item (or any without `href`) renders as the current page.

#### `ui.sheet(props, fn)` / `ui.sheet(fn, props?)`

Server-owned side panel (parallel to dialog). Returns a `SheetElement` with `open()`, `close()`, and `setOpen(boolean)`.

```typescript
const panel = ui.sheet({ title: 'Filters', side: 'right' }, () => {
  ui.label('Sheet body');
  ui.button('Done', { onClick: () => panel.close() });
});
panel.open();
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | | Heading |
| `description` | `string` | | Muted subtitle |
| `open` | `boolean` | `false` | Visibility |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'` | Edge |
| `onClose` | `() => void` | | Runs on client `close`, then `open` is cleared |

#### `ui.drawer(props, fn)` / `ui.drawer(fn, props?)`

Server-owned Vaul drawer (mobile-friendly overlay). Same open API as dialog/sheet.

| Prop | Type | Default |
|------|------|---------|
| `title` / `description` | `string` | |
| `open` | `boolean` | `false` |
| `direction` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` |
| `onClose` | `() => void` | |

#### `ui.tabs(props, fn)` / `ui.tabs(fn, props?)`

Server-owned active tab. Panels are built via `t.tab(...)`.

```typescript
ui.tabs({ value: 'one', onChange: (v) => console.log(v) }, (t) => {
  t.tab('one', 'One', () => {
    ui.label('First panel');
  });
  t.tab('two', () => {
    // label defaults to value
    ui.label('Second panel');
  });
});
```

| Prop / method | Type | Description |
|---------------|------|-------------|
| `value` | `string` | Active tab (defaults to first panel) |
| `onChange` | `(value: string) => void` | Tab change |
| `t.tab(value, fn)` | | Panel; label = `value` |
| `t.tab(value, label, fn)` | | Panel with explicit label |
| `t.tab(..., { icon? })` | | Optional curated Lucide key |

Supports `bindValue` / `setValue` like other value controls.

#### `ui.accordion(props, fn)` / `ui.accordion(fn, props?)`

Disclosure panels (optimistic `value`).

```typescript
ui.accordion({ type: 'single' }, (a) => {
  a.item('faq1', 'What is BadUI?', () => {
    ui.label('A server-driven UI toolkit.');
  });
  a.item('faq2', 'Is it reactive?', () => {
    ui.label('Yes — bindValue and refreshable.');
  });
});
```

| Prop / method | Type | Description |
|---------------|------|-------------|
| `type` | `'single' \| 'multiple'` | Default `'single'` |
| `value` | `string \| string[]` | Open panel(s); defaults to first item when single |
| `collapsible` | `boolean` | Single mode: allow collapse (default `true`) |
| `onChange` | `(value: string \| string[]) => void` | |
| `a.item(value, fn)` | | Panel; title = `value` |
| `a.item(value, title, fn)` | | Panel with title |

#### `ui.collapsible(props, fn)` / `ui.collapsible(fn, props?)`

Single expandable section. Open state is stored as element `value` (boolean) for `bindValue`.

```typescript
ui.collapsible({ title: 'Advanced', open: false }, () => {
  ui.label('Hidden by default');
});
```

| Prop | Type | Default |
|------|------|---------|
| `title` | `string` | `'Toggle'` |
| `open` | `boolean` | `false` |
| `onChange` | `(open: boolean) => void` | |

#### `ui.keybind(props)`

Headless keyboard chord listener. Renders nothing; while the node is in the tree the client listens on `window` `keydown`, matches a chord, and emits `press` → `onPress`.

```typescript
ui.keybind({
  keys: 'mod+s', // or ['mod+s', 'ctrl+s']
  onPress: async () => {
    await save();
    ui.notify('Saved', 'success');
  },
});
```

| Prop | Type | Default |
|------|------|---------|
| `keys` | `string \| string[]` | required — `+`-joined tokens, case-insensitive |
| `enabled` | `boolean` | `true` |
| `preventDefault` | `boolean` | `true` |
| `ignoreInput` | `boolean` | `true` — skip when focus is in `input` / `textarea` / `select` / `contenteditable` |
| `onPress` | `() => void \| Promise<void>` | |

**Chord tokens:** modifiers `mod` (Meta on macOS, Ctrl elsewhere), `ctrl`/`control`, `meta`/`cmd`/`command`, `alt`/`option`, `shift`; key letter/digit, `escape`/`esc`, `enter`/`return`, `space`, `tab`, arrow names (`up`/`arrowup`, …), or a single printable char (`?`, `/`). Sequences (`g` then `g`) are not supported.

#### `ui.kbd(keys | props)`

Display-only keyboard chord glyphs (ShadCN `Kbd` / `KbdGroup`). Does not listen for keydowns — pair with `ui.keybind` for behavior. Uses the same chord token grammar; `mod` renders as `⌘` on Apple platforms and `Ctrl` elsewhere.

```typescript
ui.kbd('mod+k');
ui.kbd({ keys: 'mod+s', className: 'ml-1' });
ui.kbd(['mod+k', 'ctrl+k']); // alternate chords, separated by /
```

| Prop | Type | Default |
|------|------|---------|
| `keys` | `string \| string[]` | required |
| `className` | `string` | |

### Imperative helpers

These require an active session (typically inside an async event handler). Confirm / prompt / choose are **async** (WebSocket round-trip). Notify / navigate / download / clipboard are fire-and-forget.

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
| `ui.confirm(message, options?)` | `Promise<boolean>` | Alert dialog; Cancel / Escape → `false` |
| `ui.prompt(message, options?)` | `Promise<string \| null>` | Cancel → `null` |
| `ui.choose(message, choices, options?)` | `Promise<string \| null>` | `choices` as strings or `{ value, label }` |
| `ui.notify(message, typeOrOptions?)` | `void` | ShadCN Sonner toast; types `info\|success\|warning\|error` |
| `ui.navigate(path)` | `void` | Client SPA navigate + same-WS `hello` remount (sticky `app` chrome) |
| `ui.download(filename, mime, content)` | `void` | Trigger browser download |
| `ui.clipboard(content)` | `void` | Write text to clipboard |
| `ui.theme.set(mode)` | `void` | Push `light` \| `dark` \| `system` to this client |
| `ui.theme.get()` | `ThemeMode \| null` | Last value set on this session |
| `ui.runJavaScript(code)` | `void` | Eval trusted snippet in the browser |
| `ui.scroll.to(opts)` | `void` | Scroll window (`top` / `bottom` / px) |
| `ui.scroll.intoView(selector, opts?)` | `void` | `Element.scrollIntoView` via selector |
| `ui.timer(interval, callback, options?)` | `TimerHandle` | Session-scoped timer; `interval` in **seconds**; `{ once? }`; `.activate()` / `.deactivate()` / `.cancel()` |
| `ui.upload(props?)` | `Element` | Multipart HTTP upload; see below |
| `ui.storage.tab` | | Per-browser-tab map (sessionStorage mirror) |
| `ui.storage.browser` | | Mirrored to client `localStorage` |
| `ui.storage.client` | | Mirrored to client `sessionStorage` |
| `ui.storage.user` | | Per-browser-user JSON bag (file/Redis-backed) |
| `ui.storage.app` | | Process-wide typed stores |

`ui.notify` options: `{ type?, duration?, position?, description? }` — `duration: 0` is sticky; `description` is Sonner’s secondary line; positions `top-left` \| `top-right` \| `bottom-left` \| `bottom-right`.

```typescript
const clock = ui.timer(1, () => label.setText(new Date().toLocaleTimeString()));
// clock.deactivate(); clock.activate(); clock.cancel();
ui.timer(2, () => ui.notify('Once'), { once: true });
```

Timers are cleared on WebSocket session destroy.

#### `ui.upload({ onUpload, accept?, multiple?, label?, variant?, maxSizeBytes?, abortable?, onProgress?, onError?, onAbort? })`

Opens a file picker (`variant: 'button'`, default) or a drag-and-drop shell (`variant: 'dropzone'`). Selected files are posted to `POST /upload` (multipart) with XHR progress. The client emits WS events: `upload` per file `{ name, size, type, path }`, plus optional `progress` / `error` / `abort`. Client and server enforce `accept` / `maxSizeBytes` when set (`ui.run({ uploadMaxSizeBytes, uploadAccept })` for global server limits).

```typescript
ui.upload({
  accept: '.pdf,image/*',
  multiple: true,
  onUpload: async (file) => {
    ui.notify(`Saved ${file.name} → ${file.path}`, 'success');
  },
});

ui.upload({
  variant: 'dropzone',
  label: 'Drop files here',
  multiple: true,
  onUpload: async (file) => {
    ui.notify(`Saved ${file.name}`, 'success');
  },
});
```

#### `ui.storage`

NiceGUI-style storage scopes:

| API | Scope | Persistence |
|-----|--------|-------------|
| `ui.storage.tab.get/set/delete/clear/has` | This browser tab | Mirrored to client `sessionStorage` (`badui-tab-storage`); hydrated on `hello`; survives reconnect / navigate-hello; not cleared on disconnect — only via `tab.clear()` or tab close |
| `ui.storage.browser.*` | Shared across tabs for the origin | Mirrored to client `localStorage` (hydrated on `hello`) |
| `ui.storage.client.*` | This browser tab | Mirrored to client `sessionStorage` (hydrated on `hello`) |
| `ui.storage.user.get/set/delete/clear/has` | Stable `userId` (hello / `resolveUserId`) | JSON bag via file or Redis adapter |
| `ui.storage.app.create(key, initial, options?)` | Process-wide typed store (all sessions) | Optional file/Redis adapter via `appStorageDir` / `storage.configure({ app })` |

User storage requires a `userId` on the session. The built-in client sends an anonymous localStorage id on `hello`; override with `ui.run({ resolveUserId })` or `ui.run({ authSecret })` (signed cookie via `POST /auth/session` + soft-reconnect). For a full Account demo (hash, lockout, roles, audit), see `/examples/auth`. Configure dirs via `ui.run({ userStorageDir, appStorageDir, uploadDir, uploadMaxSizeBytes, uploadAccept })`.

```typescript
const messages = ui.storage.app.create<Message[]>('chatMessages', []);
const online = ui.storage.app.create<string[]>('onlineUsers', [], { persist: false });

messages.subscribe((list) => {
  // update UI for this session
});

await messages.set([...(await messages.get()), newMessage]);
await messages.update((prev) => [...prev, newMessage]);
```

`get()` is always async for **user** / **app**. For **persisted** app stores it calls `adapter.load(key)` on every read so other processes’ writes are visible; then updates memory and notifies subscribers if the value changed. `set` / `update` write memory immediately and `await adapter.save` when persisted.

| Method | Description |
|--------|-------------|
| `storage.configure({ app?, user? })` | Set persistence adapters (partial updates leave the other unchanged) |
| `storage.app.create(key, initial, options?)` | Get or create named store; `{ persist?: boolean }` |
| `.get()` | `Promise<T>` — load from adapter when persisted |
| `.set(v)` / `.update(fn)` | `Promise<void>` — save when persisted |
| `.subscribe(listener)` | Listen for changes |
| `storage.app.clearAll()` | Test helper (clears app stores only) |
| `storage.clearAll()` | Test helper (clears app stores + user bags + both adapters) |
| `createMemoryPersistence()` | In-memory adapter for tests (`@badui/core`) |
| `createFilePersistence({ dir })` | File-backed adapter (`@badui/persistence-file`) |
| `createRedisPersistence({ client, keyPrefix? })` | Redis adapter (`@badui/persistence-redis`) — multi-process app/user bags; keep WS sticky |

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
| `.setError(message \| null)` | Set or clear field `props.error` and patch |
| `.getValue()` / `.get()` | Read `props.value` |
| `.bindValue(obj, key)` | Two-way bind to reactive object property |
| `.bindTextFrom(obj, key)` | One-way bind text from object property |
| `.bindText(() => string)` | One-way bind text from a compute fn (tracks `state` reads) |
| `.update(props?)` | Merge props or replace node |
| `.add(child)` | Append child element |
| `.refresh()` | **RefreshableElement only** — rebuild children (in-place props sync when shape is stable) |

Chaining:

```typescript
ui.label('Title')
  .classes('text-3xl', 'font-bold')
  .style({ marginBottom: '8px' });
```

---

## Reactivity

Prefer importing from `@badui/ui` (also on `ui.reactive` / `ui.subscribe` / `ui.state` / `ui.auto`). Still exported from `@badui/core`.

Compile-time `let` rewrite (Phase 2): [`docs/reactive-let.md`](./reactive-let.md) and `@badui/compiler`.

### `reactive(target)` / `ui.state(target)`

```typescript
import { reactive, ui } from '@badui/ui';

const form = reactive({ name: '', agree: false });
form.name = 'Ada'; // notifies subscribers

const s = ui.state({ count: 0 }); // alias of reactive
```

### `ui.draft(key, defaults, opts?)`

Reactive object hydrated from sync storage (default `ui.storage.tab`) with write-through on each property change. Survives reconnect / `--reload`. Sync scopes only: `tab` | `client` | `browser` (not async `user` / `app`).

```typescript
const form = ui.draft('formDemo', { name: '', email: '' });
// omit secrets: ui.draft('login', { user: '', password: '' }, { omit: ['password'] });

form.name = 'Ada'; // persisted

ui.draft.clear('formDemo'); // drop storage key; reset the object yourself if needed
```

See Form Demo (`/examples/form-demo`).

### `ui.auto(fn)`

Rebuilds the block when `state` / `reactive` properties **read** during `fn` change. Keep mutable state outside the builder. When the child tree shape is unchanged, patches props in place (`updateProps`) instead of remounting via `setChildren`.

```typescript
const s = ui.state({ count: 0 });
ui.auto(() => {
  ui.label(`Count: ${s.count}`);
  ui.button('+', { onClick: () => { s.count++; } });
});
```

### `ui.label(() => …)`

Computed label without an `auto` wrapper:

```typescript
const s = ui.state({ count: 0 });
ui.label(() => `Count: ${s.count}`);
ui.button('+', { onClick: () => { s.count++; } });
```

### `subscribe(obj, key, listener)`

```typescript
import { subscribe } from '@badui/ui';

subscribe(form, 'name', () => {
  summary.refresh();
});
```

Returns an unsubscribe function.

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

Tell the client to navigate; client updates the URL and sends `hello` for the new path on the same WebSocket. Matching `app` shell chrome stays mounted; only inset content remounts.

### `download(filename, mime, content)`

Ask the client to download a file (base64 or text content as sent over the protocol). Prefer `ui.download` from app code.

### `clipboard(content)`

Ask the client to copy text to the clipboard. Prefer `ui.clipboard` from app code.

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
  storage,
  AppStore,
  createMemoryPersistence,
  notify,
  navigate,
  download,
  clipboard,
  timer,
  TimerHandle,
} from '@badui/core';

// App code prefers the facade (includes reactive / subscribe):
import { ui, reactive, subscribe } from '@badui/ui';

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
