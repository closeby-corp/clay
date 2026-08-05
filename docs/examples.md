# Examples

Demo entry: [`apps/demo/src/main.ts`](../apps/demo/src/main.ts)  
Pages: [`apps/demo/src/examples/`](../apps/demo/src/examples/) (auto-loaded via `ui.loadPages`)

After `bun run build:client && bun run demo` (or `bun run demo:cli`), open http://localhost:4000.

## Catalog

| Route | File | Patterns shown |
|-------|------|----------------|
| `/` | `Home.ts` | Hero copy, `pageMeta` |
| `/examples/counter` | `Counter.ts` | `setText`, `refreshable`, button variants |
| `/examples/todo` | `Todo.ts` | `reactive`, `bindValue`, list `refreshable`, filters |
| `/examples/chat` | `Chat.ts` | `GlobalState`, async `get`/`set`, multi-session sync |
| `/examples/upload` | `FileUpload.ts` | Simple upload UI pattern |
| `/examples/dashboard` | `Dashboard.ts` | `stat`, `areaChart`, full-chrome `dataTable` (views, editors, detail drawer) |
| `/examples/datatable` | `DataTableDemo.ts` | `value`/`render` cells, confirm/prompt/choose, toasts |
| `/examples/charts` | `ChartDemo.ts` | `ui.areaChart` interactive ranges + live refresh |
| `/examples/slider-demo` | `SliderDemo.ts` | Slider, checkbox, select + bindings |
| `/examples/form-demo` | `FormDemo.ts` | Full form + live summary via `subscribe` |
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

## Pattern: form + live summary

```typescript
const form = reactive({ name: '', terms: false });

ui.input({ label: 'Name' }).bindValue(form, 'name');
ui.checkbox({ label: 'Accept terms' }).bindValue(form, 'terms');

const summary = ui.refreshable(() => {
  ui.label(`Name: ${form.name || '—'}`);
  ui.label(`Terms: ${form.terms}`);
});

for (const key of Object.keys(form)) {
  subscribe(form, key, () => summary.refresh());
}
```

## Pattern: shared chat (`GlobalState`)

```typescript
// main.ts (optional persistence)
import { createFilePersistence } from '@badui/persistence-file';

await GlobalState.configure({
  persistence: createFilePersistence({ dir: '.badui-data' }),
});

const messages = GlobalState.create<ChatMessage[]>('chatMessages', []);
const online = GlobalState.create<string[]>('onlineUsers', [], { persist: false });

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

## Styling tip

Class names are passed through to the React client. Use Tailwind utilities that exist in the client build (standard ShadCN/Tailwind set in `packages/client`).
