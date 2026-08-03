# Concepts

## Mental model

BadUI is **server-owned UI**:

1. Your page callback runs on the server and builds an **element tree**.
2. Each browser tab gets a **`ClientSession`** over WebSocket.
3. The React client mounts that tree and renders ShadCN components.
4. User events go to the server as `{ op: "event", id, type, value? }`.
5. Server handlers mutate elements; BadUI sends **patches** back.

You do not write React for app screens. You write `ui.button`, `ui.input`, `ui.refreshable`, etc.

```
┌─────────────┐  hello(path)   ┌──────────────────┐
│ React client│ ─────────────► │ BadUIServer / WS │
│ (ShadCN)    │ ◄── mount ──── │ ClientSession    │
│             │ ◄── patch ──── │ element tree     │
│             │ ── event ────► │ page handlers    │
└─────────────┘                └──────────────────┘
```

## Pages and sessions

```typescript
ui.page('/examples/todo', () => {
  // runs once per WebSocket session when the client connects to this path
});
```

- Register routes with `ui.page(path, fn)` (or `page` from `@badui/core`).
- On `hello`, the server creates a session, runs the page builder, and sends `mount`.
- State in local variables (`let count = 0`) is **per session** (per tab), not shared.
- Use `GlobalState` for process-wide shared data (e.g. chat messages). Configure a `PersistenceAdapter` at the app entrypoint to persist stores (default on when configured; opt out with `{ persist: false }`). `await state.get()` reloads from the adapter when persisted.

## Elements

Every `ui.*` factory returns an `Element`:

```typescript
const label = ui.label('Hello');
label.classes('text-xl font-bold');
label.setText('Hello again');
```

Elements:

- Have an `id`, `type`, `props`, and `children`
- Attach to the current parent (context stack inside `ui.row(() => { … })`)
- Serialize to JSON for the client (handlers stay on the server; only event *names* are sent)

## Updates: `setText` vs `refreshable`

### Prop updates

For changing text/value on an existing node:

```typescript
label.setText(`Count: ${count}`);
input.setValue('');
```

These enqueue `updateProps` patches.

### Structural updates

When children appear/disappear or lists change, wrap the region in `ui.refreshable`:

```typescript
const list = ui.refreshable(() => {
  for (const item of items) {
    ui.label(item);
  }
});

// later
items.push('new');
list.refresh(); // rebuilds children and sends setChildren
```

`refresh()` clears the refreshable’s children, re-runs the builder, and patches the client.

## Bindings and `reactive`

Two-way bind form controls to a reactive object:

```typescript
import { reactive } from '@badui/core';

const draft = reactive({ text: '' });
const input = ui.input({ placeholder: '…' });
input.bindValue(draft, 'text');

// read
const value = draft.text;

// write (also updates the input via patch)
draft.text = '';
```

- `reactive(obj)` — Proxy that notifies subscribers on property change
- `bindValue(obj, key)` — syncs element value ↔ `obj[key]` on `input`/`change`
- `bindTextFrom(obj, key)` — one-way sync into label text
- `subscribe(obj, key, fn)` — run a callback when a key changes (e.g. refresh a summary panel)

## Events

Declare handlers with camelCase props (`onClick`, `onChange`, `onInput`) or `.on(event, handler)`:

```typescript
ui.button('Save', {
  onClick: async () => {
    await save();
  },
});

ui.input({
  onInput: (value) => console.log(value),
});
```

The client keeps local optimistic state for inputs, textareas, checkboxes, selects, and sliders so typing/toggling feels instant while the server confirms.

## Layout context

Layout helpers push a parent onto a stack:

```typescript
ui.column(() => {
  ui.label('Title');
  ui.row(() => {
    ui.button('A');
    ui.button('B');
  });
});
```

Children created inside the callback become children of that layout element.

### App shell (`ui.run({ app })`)

Configure chrome once at startup; page modules only register content. `ui.loadPages(dir)` imports every page file under a directory; optional `pageMeta` feeds `ui.navFromPages()` for the primary sidebar.

```typescript
await ui.loadPages(new URL('./pages', import.meta.url));

ui.run({
  app: {
    title: 'My App',
    nav: ui.navFromPages(),
  },
});
```

```typescript
// pages/Charts.ts
export const pageMeta = { label: 'Charts', icon: 'chart-area', order: 90 };

ui.page('/examples/charts', () => {
  ui.label('Charts'); // inherits global shell
});
```

Opt out per route with `ui.page(path, fn, { shell: false })`. Keep explicit `ui.app(props, fn)` for advanced cases.

This is **not** a persistent client shell — on `navigate` / link click the session remounts and the shell rebuilds with the correct active nav item.

## Notifications and navigation

```typescript
ui.notify('Saved!', 'success');
ui.notify('Look here', {
  type: 'warning',
  duration: 0,
  position: 'top-right',
  description: 'Sticky toast via Sonner',
});

// still available:
import { notify, navigate } from '@badui/core';
navigate('/examples/todo');
```

`ui.notify` / `notify` map to [Sonner](https://ui.shadcn.com/docs/components/sonner) on the client (`toast.success` / `info` / `warning` / `error`). `duration: 0` is sticky; optional `description` is Sonner’s secondary line. `navigate` tells the client to change path and reconnect the session.

## Imperative overlays

```typescript
const sure = await ui.confirm('Continue?');
const name = await ui.prompt('Your name');
const pick = await ui.choose('Pick one', ['A', 'B']);
```

These open ephemeral dialogs, return Promises, and only work inside an active session (e.g. `onClick` / `onAction`). They are not synchronous — a WebSocket round-trip is required.
