# BadUI

A server-driven UI framework for TypeScript, inspired by NiceGUI (Python).

## Features

- **Server-driven rendering** with reactive state
- **Datastar** for hypermedia-driven frontend updates
- **Tailwind CSS 4 + DaisyUI 5** for styling (via CDN)
- **Bun** runtime for speed
- **Imperative `ui` API** (NiceGUI-style) with optional compile-time reactive `let`

## Quick Start

```bash
# Install dependencies
bun install

# Run demo
bun run apps/demo/src/main.ts

# Open browser
open http://localhost:4000/examples/counter
```

## Packages

| Package | Description |
|---------|-------------|
| `@badui/core` | Core framework (Component, State, Router) |
| `@badui/components` | UI components (Button, Input, Card, etc.) |
| `@badui/ui` | Imperative NiceGUI-style API (`ui.label`, `ui.row`, `ui.page`, `ui.run`) |
| `@badui/compiler` | Optional compile-time `let` → reactive state transform |
| `@badui/server` | Bun server with WebSocket support |

## Imperative UI API

```typescript
import { ui } from '@badui/ui';

ui.page('/examples/counter', () => {
  let count = 0;
  let history: number[] = [];

  ui.label('Counter Example').classes('text-3xl font-bold');
  ui.label(`Count: ${count}`).classes('text-2xl');

  if (history.length > 0) {
    ui.label(`History: ${history.join(' → ')}`);
  }

  ui.row(() => {
    ui.button('-', { on_click: () => { count = count - 1; history.push(count); } });
    ui.button('Reset', { on_click: () => { count = 0; history = []; } });
    ui.button('+', { on_click: () => { count = count + 1; history.push(count); } });
  });
});

// In your app entry (or call from main.ts after importing pages):
ui.run({ port: 4000, title: 'BadUI Demo' });
```

`ui.page` registers routes the same way as `page()` from `@badui/core`. Layout callbacks (`ui.row`, `ui.column`, `ui.container`) push/pop a container stack; `ui.label` / `ui.button` add to the current container.

With the compiler enabled (see below), top-level `let` in `ui.page` / `page()` callbacks becomes reactive state automatically. Template literals that reference reactive variables in `label()` / `button()` / `ui.label()` / `ui.button()` are auto-wrapped in getters.

## Declarative page API (still supported)

```typescript
import { page, notify } from '@badui/core';
import { button, label, container, column } from '@badui/components';

page('/counter', () => {
  let count = 0;

  return container(
    column(
      label(`Count: ${count}`),
      button('Increment', {
        on_click: () => {
          count += 1;
          notify('Incremented!', 'success');
        },
      }),
    ),
    { centered: true, width: 'md' },
  );
});
```

Without the compiler, use the `state` object passed into the page handler:

```typescript
page('/counter', ({ state }) => {
  state.defaults({ count: 0 });

  return container(
    column(
      label(() => `Count: ${state.count}`),
      button('Increment', {
        on_click: () => {
          state.count = state.count + 1;
          notify('Incremented!', 'success');
        },
      }),
    ),
    { centered: true, width: 'md' },
  );
});
```

## API Functions

```typescript
import { 
  notify,        // Toast notifications
  navigate,      // Server-side navigation
  openDialog,    // Open modal
  closeDialog,   // Close modal
  timer,         // Periodic callbacks
  cancelTimer,   // Cancel timer
  showLoading,   // Show loading overlay
  hideLoading,   // Hide loading overlay
  runJavascript  // Execute JS on client
} from '@badui/core';

// Examples
notify('Success!', 'success', { position: 'top-right', duration: 5000 });
navigate('/dashboard');
showLoading('Processing...');
timer(() => refresh(), 1000, { immediate: true });
```

## Reactive `let` compiler

The `@badui/compiler` package transforms top-level `let` declarations inside `page()` and `ui.page()` callbacks into the runtime `state` object API.

**Setup** — add a root [`bunfig.toml`](bunfig.toml):

```toml
preload = ["./packages/compiler/src/preload.ts"]
```

**Rules**

- Top-level `let` in a `page()` / `ui.page()` callback body becomes reactive state
- `state.defaults({ ... })` is injected automatically on first run
- Reads and assignments (`count = count + 1`) are rewritten to `state.count`
- `+=`, `++`, and `--` are desugared to assignments first
- `label(\`Count: ${count}\`)` and `ui.label(\`...\`)` auto-bind to `() => \`Count: ${state.count}\``
- Nested `let` and function parameters shadow outer reactive names
- `let x = input(...)` / `slider(...)` / other form factories are **not** transformed
- Pages that already use `({ state }) =>` are left unchanged
- Not yet supported: destructuring

**Tests**

```bash
bun test packages/compiler packages/core packages/ui
```

## License

MIT
