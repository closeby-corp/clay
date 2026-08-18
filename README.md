# Clay

Write the UI in TypeScript on the server. Clay renders it in the browser as a React + ShadCN app. You do not write React for screens.

Inspired by [NiceGUI](https://nicegui.io/): imperative `ui.*` calls, per-tab sessions, patches over WebSocket.

**Docs:** [docs/README.md](./docs/README.md) · **Agents:** [llms.txt](./llms.txt)

## What you can build

A file or a folder of pages becomes a running app (`clay hello.ts` or `clay ./pages --app`). From there:

- **Pages and shell** — routes, sidebar nav from `pageMeta`, optional dashboard chrome
- **Forms** — inputs, validation, `ui.draft` that survives reconnect
- **Data** — DataTable (sort, filter, grouping, remote paging), charts, DuckDB / ClickHouse / Kibana helpers
- **Auth** — signed cookies, roles, login limiter, audit log
- **Files and state** — upload/download, clipboard, `ui.storage` (tab / user / app)
- **Richer widgets** — dialogs, sheets, kanban, gantt, flow diagrams, editor, markdown, AI visual primitives (no model runtime)

Public APIs are camelCase (`onClick`, `bindValue`, `setText`).

```typescript
// hello.ts
import { ui } from '@clay/ui';

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

## Try it

Needs [Bun](https://bun.sh/) 1.1+. In this repo:

```bash
bun install
bun run build:client   # Vite client, copied into @clay/cli
bun run demo           # http://localhost:4000
```

The demo is the fastest way to see the surface: counter, todo, dashboard, auth, charts, kanban, gantt, flow, and the rest.

```bash
bun run clay hello.ts          # http://localhost:3000
bun run clay ./pages --app     # multi-page shell + nav
bun run dev                    # build client, then demo
```

Using packed or published packages (no monorepo checkout): [Getting started](./docs/getting-started.md). The CLI ships a prebuilt client — no Vite step after install.

## How it works

```
Your ui.page / ui.run code
  → per-tab element tree on the server
  → WebSocket: hello / mount / patch / event
  → React client → ShadCN
```

You mutate elements (`setText`, `refreshable`, bindings). Clay sends patches. The client is a renderer, not your app.

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting started](./docs/getting-started.md) | Install, CLI, first app |
| [Concepts](./docs/concepts.md) | Sessions, elements, refreshable, bindings |
| [API reference](./docs/api.md) | `ui.*` and Element |
| [Elements](./docs/elements.md) | Wire types and client mapping |
| [Examples](./docs/examples.md) | Demo routes and patterns |
| [Architecture](./docs/architecture.md) | Packages and data flow |
| [WebSocket protocol](./docs/protocol.md) | Message formats |
| [AI UI](./docs/ai.md) | `ui.ai.*` primitives |
| [DuckDB](./docs/duckdb.md) / [ClickHouse](./docs/clickhouse.md) / [Kibana](./docs/kibana.md) | Data clients |

## Packages

| Package | Role |
|---------|------|
| `@clay/ui` | App-facing `ui` facade |
| `@clay/cli` | `clay` — run a file or page directory |
| `@clay/core` | Element tree, session, reactive, protocol, storage |
| `@clay/components` | Element factories |
| `@clay/server` | Bun HTTP + WebSocket |
| `@clay/client` | React + ShadCN renderer (private; build is copied into the CLI) |
| `@clay/auth` | Password hash, login limiter, guards, audit |
| `@clay/compiler` | Optional compile-time reactive `let` |
| `@clay/persistence-file` / `@clay/persistence-redis` | Storage adapters |
| `@clay/duckdb` / `@clay/clickhouse` / `@clay/kibana` | Data clients |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run build:client` | Build the React client (+ copy into `@clay/cli`) |
| `bun run demo` | Demo server at :4000 |
| `bun run demo:cli` | Same examples via `clay … --app` |
| `bun run clay …` | Workspace CLI |
| `bun run dev` | Build client, then demo |
| `bun test` | Package tests |
| `bun run pack:publishable` | Pack runtime packages into `dist-pack/` |
| `bun run publish:dry` / `publish:npm` | Validate / publish (maintainers) |

Publish order and pack details: [Getting started](./docs/getting-started.md#publishing-to-npm-maintainers).

## License

MIT. The root workspace is private; runtime packages (`@clay/cli`, `@clay/ui`, …) are publishable. `@clay/client` stays private — its build ships inside `@clay/cli`.
