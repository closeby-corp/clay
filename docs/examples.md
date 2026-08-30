# Examples

Demo entry: [`apps/demo/src/main.ts`](../apps/demo/src/main.ts)  
Pages: [`apps/demo/src/examples/`](../apps/demo/src/examples/) (auto-loaded via `ui.loadPages`)

After `bun run build:client && bun run demo` (or `bun run demo:cli`), open http://localhost:4000.

## Catalog

| Route | File | Patterns shown |
|-------|------|----------------|
| `/` | `Home.ts` | `ui.hero`, `ui.icon`, `ui.link`, `ui.navigate`; catalog via `ui.navFromPages()` (same as sidebar) |
| `/examples/counter` | `Counter.ts` | `setText`, `refreshable`, button variants |
| `/examples/todo` | `Todo.ts` | `reactive`, `bindValue`, list `refreshable`, filters |
| `/examples/chat` | `Chat.ts` | `ui.storage.app` (persisted messages + ephemeral presence), async `get`/`set` |
| `/examples/ai` | `AiDemo.ts` | `ui.ai.*` gallery — chat, prompt bar, loader/thinking, agent cards, diff/insights/fine-tune (static props; no model runtime) |
| `/examples/upload` | `FileUpload.ts` | `ui.upload` button + dropzone (progress/abort/size), `ui.storage.tab` / `user`, `ui.download`, `ui.clipboard` |
| `/examples/dashboard` | `Dashboard.ts` | `stat`, `areaChart`, full-chrome `dataTable` (views, editors, detail drawer) |
| `/examples/datatable` | `DataTableDemo.ts` | Multi-sort (Shift+click / badges), footer aggregates + a11y hints, column pin, remote filter/sort + pagination; density/zebra, editors (Enter/Esc + focus restore), resize, virtualization (≥40, coexists with reorder via windowed drop targets); facets, bulk, collapse/expand, loading/empty; `ui.table` sugar |
| `/examples/composed` | `ComposedDemo.ts` | ReUI batch 1: `ui.timeline`, `ui.stepper`, `ui.dateRange`, `ui.feedList`/`ui.feedRow`, `ui.sparkline` |
| `/examples/reui-batches` | `ReuiBatchesDemo.ts` | ReUI batches 3–6: `buttonGroup`, `empty`, `pagination`, `filterBar`, form inputs, `navigationMenu`, `notice`, `stat`+sparkline, `eventCalendar`, datatable `showFilterChips` |
| `/examples/reui-batch-7` | `ReuiBatch7Demo.ts` | ReUI batch 7: `inputGroup`, `toggle`, `descriptionList`, `staticTable`, `aspectRatio`, `itemList`, `checkboxGroup` |
| `/examples/charts` | `ChartDemo.ts` | `ui.chart.*`, `ui.sparkline`, composed/scatter charts |
| `/examples/slider-demo` | `SliderDemo.ts` | Slider, checkbox, select + bindings |
| `/examples/feedback` | `FeedbackDemo.ts` | Alerts, progress, timer, `ui.theme`, `ui.runJavaScript` / `ui.scroll` |
| `/examples/form-demo` | `FormDemo.ts` | Form + validate + `ui.draft` + rating / colorPicker / tags |
| `/examples/auth` | `Auth.ts` (+ login/admin/change-password) | Signed cookie session, hashed passwords, login lockout, role-gated admin + audit log |
| `/examples/timer-content` | `TimerContent.ts` | `ui.timer`, markdown, html, image |
| `/examples/overlays` | `OverlaysDemo.ts` | Breadcrumb, dropdown/context menu, hover card, popover, dialog/sheet/drawer |
| `/examples/dialog-stack` | `DialogStackDemo.ts` | `ui.dialogStack` multi-step stacked modal |
| `/examples/controls` | `ControlsDemo.ts` | Menubar (submenu/checkbox/radio), command dialog + inline, carousel, resizable, scroll-area, `ui.state` / `ui.auto` |
| `/examples/controls-extra` | `ControlsExtra.ts` | `ui.codeBlock` (Shiki), `ui.tree` |
| `/examples/media-extra` | `MediaExtra.ts` | `ui.relativeTime`, `ui.qrCode`, `ui.imageZoom`, `ui.imageCrop` |
| `/examples/editor` | `EditorDemo.ts` | `ui.editor` HTML + Markdown side-by-side, bindValue |
| `/examples/kanban` | `KanbanDemo.ts` | `ui.kanban` swimlanes, card detail drawer, element-owned `cardMove`/`cardSelect`, reset via APIs |
| `/examples/list` | `ListDemo.ts` | `ui.list` element-owned groups, `itemMove` settle, reset via `setGroups` |
| `/examples/gantt` | `GanttDemo.ts` | `ui.gantt` owned rows/dates/markers/deps, cross-row drag, header double-click markers, `itemMove` / `markerAdd` settle |
| `/examples/flow` | `FlowDemo.ts` | Four `ui.flow` demos: ETL with in-node controls + labeled edges + dagre auto-layout, multi-handle approval branches, fan-in/out + `addNode` dynamic stages, group/`parentId` nesting (flow-owned edges/positions; no outer diagram `ui.auto`) |
| `/examples/data-clients` | `DataClientsDemo.ts` | DuckDB / Kibana / ClickHouse integration story (mock-friendly) |
| `/examples/kitchen-sink` | `KitchenSink.ts` | ShadCN catalog preview (client `KitchenSink`) |

Each page file exports optional `pageMeta` (`label`, `icon`, `order`, optional `nav: false`, optional `roles`) for `ui.navFromPages()`.

## Pattern: sign in → account → admin (or access denied)

Try the journey as an end user (sidebar **Account**, or `/examples/auth` while logged out):

1. **Sign in** (`/examples/auth/login`, no app shell) with **Alice** (administrator) or **Bob** (member), password `password`. Alice is prompted to **change password** once.
2. **My account** shows name + role; Preferences save per signed-in user id; **Open admin console** is always visible on the account page.
3. As **Bob**, sidebar hides **Admin** (`pageMeta.roles`); opening `/examples/auth/admin` shows **Access denied**. As **Alice**, Admin appears in nav; the console lists signed-in people, can **Sign everyone else out**, and shows an **audit log**.
4. **Sign out** clears the HttpOnly auth cookie and soft-reconnects; visiting Account/Admin while signed out redirects to Sign in.
5. Kill the WebSocket / refresh — cookie identity keeps you signed in. Idle timeout (`sessionIdleMs` on `ui.run`) signs out.

Helpers live in `_auth.ts` (skipped by `loadPages`): `@close-by/clay-auth` password hash + login limiter, cookie session via `ui.establishAuthSession`, online roster in `ui.storage.app`, plus `requireAuth` / `requireRole`.

## Pattern: app entry + discovered pages

```typescript
// main.ts — or shared demo-run.ts used by CLI `_run.ts`
await ui.loadPages(new URL('./examples', import.meta.url));

ui.run({
  port: 4000,
  title: 'Clay Demo',
  authSecret: process.env.CLAY_AUTH_SECRET ?? '…',
  app: {
    title: 'Clay',
    get nav() {
      // role-aware; see apps/demo/src/demo-run.ts
      return ui.navFromPages(/* { role } */);
    },
  },
});
```

Or via CLI (same pages + shell; demo auth from `examples/_run.ts`):

```bash
bun run demo:cli
# → clay apps/demo/src/examples --app -p 4000
```

Directory mode looks for optional `_run.ts` exporting `configureRun(base)` so `demo:cli` gets the same `authSecret` / session timeouts / role-aware nav as `bun run demo`.

```typescript
// examples/Counter.ts
export const pageMeta = { label: 'Counter', icon: 'hash', order: 10 };

ui.page('/examples/counter', () => {
  // content only — shell from ui.run({ app })
});
```

## Pattern: counter (imperative updates)

```typescript
ui.page('/examples/counter', () => {
  let count = 0;
  const countLabel = ui.label(`Count: ${count}`);

  ui.button('+', {
    onClick: () => {
      count++;
      countLabel.setText(`Count: ${count}`);
    },
  });
});
```

Use `setText` / `setValue` when the node identity stays the same.

## Pattern: todo list (refreshable + bindValue)

```typescript
import { ui, reactive } from '@close-by/clay';

const draft = reactive({ text: '' });
const input = ui.input({ placeholder: 'What needs to be done?' });
input.bindValue(draft, 'text');

const listUi = ui.refreshable(() => {
  for (const todo of todos) {
    ui.label(todo.text);
  }
});

ui.button('Add', {
  onClick: () => {
    todos = [...todos, { id: crypto.randomUUID(), text: draft.text, completed: false }];
    draft.text = '';
    listUi.refresh();
  },
});
```

## Pattern: form + live summary + validate

```typescript
import { ui, reactive, subscribe } from '@close-by/clay';

const form = reactive({ name: '', terms: false });

const nameInput = ui.input({ label: 'Name' }).bindValue(form, 'name');
const termsBox = ui.checkbox({ label: 'Accept terms' }).bindValue(form, 'terms');

ui.button('Submit', {
  onClick: () => {
    const ok = ui.validate([
      { el: nameInput, check: () => (form.name.trim() ? null : 'Name is required') },
      { el: termsBox, check: () => (form.terms ? null : 'Accept the terms') },
    ]);
    if (!ok) return;
    nameInput.setError(null);
    termsBox.setError(null);
  },
});

const summary = ui.refreshable(() => {
  ui.label(`Name: ${form.name || '—'}`);
  ui.label(`Terms: ${form.terms}`);
});

for (const key of Object.keys(form)) {
  subscribe(form, key, () => summary.refresh());
}
```

## Pattern: shared chat (`ui.storage.app`)

```typescript
// main.ts (optional persistence)
import { createFilePersistence } from '@close-by/clay-persistence-file';
import { storage } from '@close-by/clay-core';
// or: ui.run({ appStorageDir: '.clay-data' })

storage.configure({
  app: createFilePersistence({ dir: '.clay-data' }),
});

const messages = ui.storage.app.create<ChatMessage[]>('chatMessages', []);
const online = ui.storage.app.create<string[]>('onlineUsers', [], { persist: false });

messages.subscribe(() => {
  void list.refresh();
});

ui.button('Send', {
  onClick: async () => {
    await messages.update((prev) => [...prev, { user, text, at: Date.now() }]);
  },
});
```

All connected sessions that subscribed will refresh when the store changes. With a persistence adapter configured, `get()` loads from the backend on every read; pass `{ persist: false }` for ephemeral keys (e.g. online presence).

## Pattern: DataTable views

```typescript
ui.dataTable(docs, {
  keyField: 'id',
  views: [
    { id: 'all', label: 'All' },
    { id: 'done', label: 'Done', filter: (row) => row.status === 'Done' },
  ],
  defaultView: 'all',
  // …
});
```

Every tab shows the table; the active view’s `filter` lenses rows. Badge counts auto-derive when `count` is omitted.

## Pattern: DataTable grouping

```typescript
ui.dataTable(tasks, {
  keyField: 'id',
  groupBy: 'status', // or (row) => row.owner
  // defaultCollapsed: true,
  onGroupToggle: (groupKey, collapsed) => {
    console.log(groupKey, collapsed ? 'collapsed' : 'expanded');
  },
  // …
});
```

Filter/sort run first; rows are then stably partitioned into contiguous groups. The client draws collapsible headers plus Collapse all / Expand all; collapse is client-owned (like selection).

## Pattern: DataTable facet filters

```typescript
ui.dataTable(tasks, {
  keyField: 'id',
  columns: [
    { key: 'title', header: 'Title' },
    {
      key: 'status',
      header: 'Status',
      filter: 'facet',
      facetOptions: [
        { value: 'todo', label: 'Todo' },
        { value: 'done', label: 'Done' },
      ],
    },
    { key: 'owner', header: 'Owner', filter: 'facet' }, // options derived from distinct values
  ],
});
```

Facet columns filter with multi-select exact match from a header popover. Text columns use the same header filter button with a substring input popover.

## Pattern: DataTable manual / remote pagination

When `manualPagination` is true, rows are the **current page only** — the table does **not** filter, sort, group, or slice locally. It keeps chrome state (`getQuery()`) and emits change events; your app applies that query on the server and calls `setRows` + `setTotalRows`.

**Loading / empty during refetch:** call `setLoading(true)` (or `withLoading`) **before** awaiting the fetch and keep previous rows until `setRows`. Loading hides the empty state; clearing rows first can flash empty if loading is late.

```typescript
let page = 1;
let pageSize = 10;
let filter = '';
let columnFilters: Record<string, string> = {};
let sorts: Array<{ key: string; dir: 'asc' | 'desc' }> = [];

const remote = ui.dataTable([], {
  keyField: 'id',
  manualPagination: true,
  totalRows: 0,
  pageSize,
  searchable: true,
  onPageChange: async (p) => {
    page = p;
    await load();
  },
  onPageSizeChange: async (size) => {
    pageSize = size;
    page = 1;
    await load();
  },
  onFilterChange: async (q) => {
    filter = q;
    page = 1;
    await load();
  },
  onColumnFilterChange: async (filters) => {
    columnFilters = filters;
    page = 1;
    await load();
  },
  onSortChange: async (next) => {
    sorts = next;
    page = 1;
    await load();
  },
  columns: [/* … */],
});

async function load() {
  await remote.withLoading(async () => {
    // Or: const q = remote.getQuery();
    const { rows, total } = await fetchPage({
      page,
      pageSize,
      filter,
      columnFilters,
      sorts,
    });
    remote.setRows(rows);
    remote.setTotalRows(total);
  });
}
```

Footer `aggregate` values in this mode are computed over the **provided page rows** (not the full remote set). The pager footer uses `totalRows`. For hybrid local paging with remote filter or sort only, set `manualFiltering` / `manualSorting` without `manualPagination`.

## Styling tip

Class names are passed through to the React client. Use Tailwind utilities that exist in the client build (standard ShadCN/Tailwind set in `packages/client`).
