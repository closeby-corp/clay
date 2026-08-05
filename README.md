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

**Outside this monorepo** (packed or published packages):

```bash
# After `bun run pack:publishable` in a BadUI checkout — or once packages are on npm:
npm install ./dist-pack/badui-*-0.1.0.tgz   # local packs; see docs/getting-started.md
# bun add @badui/cli @badui/ui               # when published to the registry

bunx badui hello.ts   # ships prebuilt client-dist — no Vite build needed
```

**This monorepo:**

```bash
bun install
bun run build:client   # Vite → packages/client/dist (+ copy into @badui/cli)
bun run badui hello.ts # http://localhost:3000

# Demo app
bun run demo           # http://localhost:4000
bun run demo:cli       # same via `badui … --app`
bun run dev            # build client + start demo
```

`@badui/cli` ships prebuilt client assets. In this repo, run `build:client` (or `pack:publishable`) so the workspace CLI / demo have assets to serve.

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
| `bun run pack:publishable` | `build:client` + pack runtime packages into `dist-pack/` |
| `bun run demo` | Start the demo server |
| `bun run demo:cli` | Demo via `badui … --app` |
| `bun run badui …` | CLI runtime |
| `bun run dev` | Build client, then demo |
| `bun test` | Run package tests |

## Current gaps vs full NiceGUI

Still out: JS bridge, horizontal scaling, DataTable row grouping, compile-time reactive `let`, browser/general storage + Redis, composed/scatter charts.

In: facade basics, timer / markdown / html / image, **real upload** (`POST /upload` + `ui.upload`), **tab/user storage** (`ui.storage`), **chart zoo** (`area` / `bar` / `line` / `pie` / `radar` / `radial`), DataTable selection/edit, and recent ShadCN wires (radio, date, tooltip, accordion, avatar, skeleton, sheet, drawer).

## License

Root workspace is private. Runtime packages (`@badui/cli`, `@badui/ui`, …) are packable via `bun run pack:publishable` (not necessarily published to npm yet). `@badui/client` stays private — its build is copied into `@badui/cli`.
