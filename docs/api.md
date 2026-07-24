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

#### `ui.dataTable(rows, props)`

Simple read-only table.

```typescript
ui.dataTable(rows, {
  columns: [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'amount', header: 'Amount', align: 'right' },
  ],
});
```

| Column field | Type |
|--------------|------|
| `key` | `string` |
| `header` | `string` |
| `align` | `'left' \| 'right' \| 'center'` |

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

### `notify(message, type?)`

Toast on the client. Types: `'info' | 'success' | 'warning' | 'error'` (default `'info'`).

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
