# Examples

Demo entry: [`apps/demo/src/main.ts`](../apps/demo/src/main.ts)  
Pages: [`apps/demo/src/examples/`](../apps/demo/src/examples/) (auto-loaded via `ui.loadPages`)

After `bun run build:client && bun run demo` (or `bun run demo:cli`), open http://localhost:4000.

## Catalog

| Route | File | Patterns shown |
|-------|------|----------------|
| `/` | `Home.ts` | `ui.hero`, `ui.icon`, `ui.link`, `ui.navigate`, `pageMeta` |
| `/examples/counter` | `Counter.ts` | `setText`, `refreshable`, button variants |
| `/examples/todo` | `Todo.ts` | `reactive`, `bindValue`, list `refreshable`, filters |
| `/examples/chat` | `Chat.ts` | `ui.storage.app` (persisted messages + ephemeral presence), async `get`/`set` |
| `/examples/upload` | `FileUpload.ts` | `ui.upload`, `ui.storage.tab` / `user`, `ui.download`, `ui.clipboard` |
| `/examples/dashboard` | `Dashboard.ts` | `stat`, `areaChart`, full-chrome `dataTable` (views, editors, detail drawer) |
| `/examples/datatable` | `DataTableDemo.ts` | Primary `ui.table(...).build()`; badges, grouping, confirm/prompt/choose; props `dataTable` sample |
| `/examples/charts` | `ChartDemo.ts` | Primary `ui.chart.*` (categories / timeSeries / pie / radar / radial); props API sample |
| `/examples/slider-demo` | `SliderDemo.ts` | Slider, checkbox, select + bindings |
| `/examples/feedback` | `FeedbackDemo.ts` | `ui.alert`, `ui.spinner`, `ui.progress`, `ui.separator`, `ui.timer`, `ui.theme.set` |
| `/examples/form-demo` | `FormDemo.ts` | Full form + `ui.validate` / `.setError` submit gate + live summary via `subscribe` |
| `/examples/timer-content` | `TimerContent.ts` | `ui.timer`, markdown, html, image |
| `/examples/overlays` | `OverlaysDemo.ts` | `ui.breadcrumb`, `ui.dropdownMenu`, `ui.alertDialog`, dialog, sheet, drawer, tabs, accordion |
| `/examples/kitchen-sink` | `KitchenSink.ts` | ShadCN catalog preview (client `KitchenSink`) |

Each page file exports optional `pageMeta` (`label`, `icon`, `order`) for `ui.navFromPages()`.

## Pattern: app entry + discovered pages

```typescript
// main.ts
await ui.loadPages(new URL('./examples', import.meta.url));

ui.run({
  port: 4000,
  title: 'BadUI Demo',
  app: {
    title: 'BadUI',
    nav: ui.navFromPages(),
  },
});
```

Or via CLI (same pages + shell defaults):

```bash
bun run demo:cli
# → badui apps/demo/src/examples --app -p 4000
```

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
import { ui, reactive } from '@badui/ui';

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
import { ui, reactive, subscribe } from '@badui/ui';

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
import { createFilePersistence } from '@badui/persistence-file';
import { storage } from '@badui/core';
// or: ui.run({ appStorageDir: '.badui-data' })

storage.configure({
  app: createFilePersistence({ dir: '.badui-data' }),
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

Filter/sort run first; rows are then stably partitioned into contiguous groups. The client draws collapsible headers; collapse is client-owned (like selection).

## Styling tip

Class names are passed through to the React client. Use Tailwind utilities that exist in the client build (standard ShadCN/Tailwind set in `packages/client`).
