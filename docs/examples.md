# Examples

Demo entry: `apps/demo/src/main.ts`  
Pages: `apps/demo/src/examples/`

After `bun run build:client && bun run demo`, open http://localhost:4000.

## Catalog

| Route | File | Patterns shown |
|-------|------|----------------|
| `/` | `Home.ts` | Links, hero layout |
| `/examples/counter` | `Counter.ts` | `setText`, `refreshable`, button variants |
| `/examples/todo` | `Todo.ts` | `reactive`, `bindValue`, list `refreshable`, filters |
| `/examples/chat` | `Chat.ts` | `GlobalState`, multi-session shared messages |
| `/examples/upload` | `FileUpload.ts` | Simple upload UI pattern |
| `/examples/dashboard` | `Dashboard.ts` | `stat`, `dataTable` |
| `/examples/datatable` | `DataTableDemo.ts` | Table of rows/columns |
| `/examples/slider-demo` | `SliderDemo.ts` | Slider, checkbox, select + bindings |
| `/examples/form-demo` | `FormDemo.ts` | Full form + live summary via `subscribe` |

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
const messages = GlobalState.create<ChatMessage[]>('chatMessages', []);

messages.subscribe(() => list.refresh());

ui.button('Send', {
  onClick: () => {
    messages.update((prev) => [...prev, { user, text, at: Date.now() }]);
  },
});
```

All connected sessions that subscribed will refresh when the store changes.

## Styling tip

Class names are passed through to the React client. Use Tailwind utilities that exist in the client build (standard ShadCN/Tailwind set in `packages/client`).
