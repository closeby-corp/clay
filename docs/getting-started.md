# Getting started

## Requirements

- [Bun](https://bun.sh/) 1.1+
- Node-compatible OS (macOS / Linux / WSL)

## Install and run the demo

```bash
bun install
bun run build:client   # builds packages/client → packages/client/dist
bun run demo           # starts apps/demo on :4000
```

Or in one step:

```bash
bun run dev
```

Open:

- http://localhost:4000 — home with links to examples
- http://localhost:4000/examples/counter
- http://localhost:4000/examples/todo
- http://localhost:4000/examples/form-demo

| Script | What it does |
|--------|----------------|
| `bun run build:client` | Vite production build of the React client |
| `bun run demo` | Start demo server (expects client already built) |
| `bun run dev` | Build client, then start demo |
| `bun test` | Run core/ui/server tests |

## Minimal app

Create a page file and an entrypoint:

```typescript
// pages/counter.ts
import { ui } from '@badui/ui';

ui.page('/counter', () => {
  let count = 0;
  const label = ui.label(`Count: ${count}`).classes('text-2xl');

  ui.row(() => {
    ui.button('-', {
      variant: 'destructive',
      onClick: () => {
        count--;
        label.setText(`Count: ${count}`);
      },
    });
    ui.button('+', {
      onClick: () => {
        count++;
        label.setText(`Count: ${count}`);
      },
    });
  }, { gap: 2 });
});
```

```typescript
// main.ts
import { fileURLToPath } from 'url';
import { ui } from '@badui/ui';
import './pages/counter';

ui.run({
  port: 4000,
  title: 'My App',
  clientDir: fileURLToPath(new URL('../packages/client/dist', import.meta.url)),
});
```

Point `clientDir` at a built `@badui/client` dist (or the monorepo’s `packages/client/dist`).

## Project layout (monorepo)

```
apps/demo/           Demo pages + server entry
packages/ui/         NiceGUI-style ui facade
packages/core/       Element tree, session, protocol, reactive
packages/components/ Element factories (button, input, …)
packages/client/     React + ShadCN renderer
packages/server/     Bun HTTP + WebSocket
docs/                This documentation
```

## Next steps

- [Concepts](./concepts.md) — how updates work
- [API reference](./api.md) — full `ui.*` surface
- [Examples](./examples.md) — Todo, forms, chat patterns
