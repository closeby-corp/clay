# BadUI

Server-driven UI for TypeScript, inspired by [NiceGUI](https://nicegui.io/).

You write imperative `ui.*` on the server. BadUI owns a per-client element tree and syncs it to a thin **React + ShadCN** client over **WebSocket**.

**Full documentation:** [docs/README.md](./docs/README.md)

## Features

- **NiceGUI-like API** — `ui.page`, `ui.run(root?)`, `ui.button`, `ui.refreshable`, `bindValue`, `setText`, `onClick`
- **`badui` CLI** — `badui hello.ts` or `badui ./pages --app`
- **Server-owned element tree** — per-tab sessions; incremental WS patches
- **React + ShadCN client** — Radix/Tailwind under the hood
- **camelCase everywhere** on the public API and wire protocol
- **Bun monorepo** — TypeScript end-to-end

## Quick start

```bash
bun install
bun run build:client   # Vite → packages/client/dist (+ copy into @badui/cli)
bun run badui hello.ts # http://localhost:3000

# Demo app
bun run demo           # http://localhost:4000
bun run demo:cli       # same via `badui … --app`
bun run dev            # build client + start demo
```

Installed `@badui/cli` ships prebuilt client assets — consumers can `bunx badui hello.ts` without a monorepo `build:client`. In this repo, run `build:client` once so the workspace CLI / demo have assets to serve.

```typescript
// hello.ts
import { ui } from '@badui/ui';

ui.run(() => {
  let count = 0;
  const label = ui.label(`Count: ${count}`);

  ui.row(() => {
    ui.button('-', {
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
  });
});
```

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting started](./docs/getting-started.md) | Install, run, minimal app |
| [Concepts](./docs/concepts.md) | Sessions, elements, refreshable, bindings |
| [API reference](./docs/api.md) | Complete `ui.*` and Element API |
| [Elements](./docs/elements.md) | Wire types and client mapping |
| [WebSocket protocol](./docs/protocol.md) | Message formats |
| [Architecture](./docs/architecture.md) | Packages and data flow |
| [Examples](./docs/examples.md) | Demo routes and patterns |

## Packages

| Package | Role |
|---------|------|
| `@badui/ui` | NiceGUI-style `ui` facade |
| `@badui/cli` | `badui` runtime — run a file or page directory |
| `@badui/core` | Element tree, session, reactive, protocol |
| `@badui/components` | Element factories |
| `@badui/client` | React + ShadCN renderer |
| `@badui/server` | Bun HTTP + WebSocket |

## Architecture (short)

```
App (ui.page / ui.refreshable)
  → Server element tree (per WebSocket session)
  → WS: hello / mount / patch / event
  → React client → ShadCN components
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run build:client` | Build the React client (+ copy into `@badui/cli`) |
| `bun run demo` | Start the demo server |
| `bun run demo:cli` | Demo via `badui … --app` |
| `bun run badui …` | CLI runtime |
| `bun run dev` | Build client, then demo |
| `bun test` | Run package tests |

## Current gaps vs full NiceGUI

Not in the first cut: timers / JS bridge, horizontal scaling, advanced DataTable (selection/edit/group), full control catalog, compile-time reactive `let`.

## License

Private / unpublished unless otherwise noted.
