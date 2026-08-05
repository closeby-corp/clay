# Getting started

## Requirements

- [Bun](https://bun.sh/) 1.1+
- Node-compatible OS (macOS / Linux / WSL)

## Three-line app (`badui`)

```typescript
// hello.ts
import { ui } from '@badui/ui';

ui.run(() => {
  ui.label('Hello BadUI');
  ui.button('Ping', { onClick: () => ui.notify('hi', 'success') });
});
```

**Published / installed `@badui/cli`:** the package ships prebuilt client assets (`client-dist`). After install you can run:

```bash
bunx badui hello.ts   # → http://localhost:3000 (opens browser)
```

**This monorepo:** build the client once (also copies assets into `@badui/cli` for packaging), then use the workspace CLI:

```bash
bun install
bun run build:client          # Vite → packages/client/dist (+ copy → packages/cli/client-dist)
bun run badui hello.ts        # → http://localhost:3000 (opens browser)
```

The CLI prefers `packages/cli/client-dist` when present, otherwise falls back to `packages/client/dist` so local `bun run badui` / `demo:cli` work after a single `build:client`.

Or a default export (CLI registers `/` and starts the server for you):

```typescript
import { ui } from '@badui/ui';

export default function () {
  ui.label('Hello BadUI');
}
```

```bash
bun run badui hello.ts --port 4000
```

### Multi-page SPA with shell

```bash
bun run badui ./pages --app --title "My App"
# loadPages + ui.run({ app: { title, nav: navFromPages() } })
```

| Flag | Meaning |
|------|---------|
| `-p, --port` | Port (default `3000`) |
| `-t, --title` | HTML / shell title |
| `--app` | Dashboard shell + nav from discovered pages |
| `--no-open` | Do not open the browser |
| `--reload` | Restart on file changes (`bun --watch`) |

## Install and run the demo

```bash
bun install
bun run build:client   # builds packages/client → dist, copies into @badui/cli
bun run demo           # starts apps/demo on :4000
# or
bun run demo:cli       # same examples via `badui … --app`
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
| `bun run build:client` | Vite production build of the React client + copy into `@badui/cli` |
| `bun run demo` | Start demo server (`main.ts`; expects client already built) |
| `bun run demo:cli` | Start demo via `badui apps/demo/src/examples --app` |
| `bun run badui …` | CLI runtime (`@badui/cli`) |
| `bun run dev` | Build client, then start demo |
| `bun test` | Run package tests |

## Library mode (multi-page entrypoint)

Create a page file and an entrypoint:

```typescript
// pages/counter.ts
import { ui } from '@badui/ui';

export const pageMeta = { label: 'Counter', icon: 'hash', order: 10 };

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
import { ui } from '@badui/ui';

await ui.loadPages(new URL('./pages', import.meta.url));

ui.run({
  port: 4000,
  title: 'My App',
  css: './globals.css', // optional theme overrides
  app: {
    title: 'My App',
    nav: ui.navFromPages(),
  },
});
```

Point `clientDir` at a built `@badui/client` dist only if the default (`packages/client/dist`) is wrong for your layout. The `badui` CLI serves shipped assets from `packages/cli/client-dist` (or the monorepo `packages/client/dist` fallback).

Use `css` to inject your own `globals.css` after the built client styles — override shadcn-style tokens such as `--primary`, `--background`, and `--sidebar` (and optional `.dark`) without rebuilding the client. Runtime CSS cannot add new Tailwind utilities; use those variables or plain CSS.

## Project layout (monorepo)

```
apps/demo/           Demo pages + server entry (`loadPages` + `ui.run({ app })`)
packages/cli/         `badui` binary — file/dir launcher + shipped client-dist
packages/ui/         NiceGUI-style ui facade (`loadPages`, `navFromPages`, `run`)
packages/core/       Element tree, session, page wrapper, reactive, GlobalState
packages/persistence-file/  File-backed PersistenceAdapter for GlobalState
packages/components/ Element factories (button, input, dataTable, areaChart, …)
packages/client/     React + ShadCN renderer (Sonner toasts, BoundDataTable, …)
packages/server/     Bun HTTP + WebSocket
docs/                This documentation
```

## Next

- [Concepts](./concepts.md) — sessions, patches, refreshable
- [API](./api.md) — full `ui.*` reference
- [Examples](./examples.md) — demo catalog
