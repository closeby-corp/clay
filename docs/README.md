# Clay Documentation

Server-driven UI for TypeScript, inspired by [NiceGUI](https://nicegui.io/).

You write imperative `ui.*` code on the server. Clay owns a per-client element tree and syncs it to a thin React + ShadCN client over WebSocket.

For coding agents: the repo-root [llms.txt](../llms.txt) is a short map of these guides.

## Guides

| Doc | Description |
|-----|-------------|
| [Getting started](./getting-started.md) | Install, `clay` CLI, create a page |
| [Boot: CLI vs library](./boot.md) | Production `ui.run` path, `clientDir`, `_run.ts`, reload stubs |
| [Tailwind](./tailwind.md) | Zero-config utilities from page modules; optional tokens |
| [Sample app](./tutorial.md) | Step-by-step tasks list, then two pages + shell |
| [Concepts](./concepts.md) | Mental model: sessions, elements, patches; **canonical `state`/`auto`/`timer` recipe**; reactive `let` alternative |
| [Browser APIs](./browser-apis.md) | Prefer `ui.clipboard` / hash / `openExternal` — never `window` in page code |
| [Production & security](./production.md) | Auth, server exposure, rate limits, boot parity |
| [Ops patterns](./ops-patterns.md) | Dense consoles: chips, master–detail, feeds, sensitive logs, auth nav |
| [API reference](./api.md) | `ui.*`, `Element` methods, `reactive`, helpers |
| [Elements](./elements.md) | All element types and props |
| [WebSocket protocol](./protocol.md) | Client ↔ server message formats |
| [Architecture](./architecture.md) | Packages, data flow, and ownership |
| [Examples](./examples.md) | Demo apps and patterns |
| [Reactive `let`](./reactive-let.md) | NiceGUI-style `let` transform (opt-in `--reactive-let`) |
| [AI UI](./ai.md) | `ui.ai.*` visual AI primitives (no model runtime) |
| [DuckDB](./duckdb.md) | Multi-DB DuckDB wrapper (`@close-by/clay-duckdb`) |
| [Kibana](./kibana.md) | Kibana REST + ES search (`@close-by/clay-kibana`) |
| [ClickHouse](./clickhouse.md) | Multi-connection ClickHouse wrapper (`@close-by/clay-clickhouse`) |

## Quick start

```bash
bun install
bun run build:client   # monorepo: build + copy client into @close-by/clay-cli
bun run clay hello.ts
# → http://localhost:3000
```

Outside the monorepo: `bun run pack:publishable` then install the `dist-pack/*.tgz` set (see [Getting started](./getting-started.md)), or `bun add @close-by/clay-cli @close-by/clay` once published. Maintainers: `bun run publish:dry` / `publish:npm` (order core → … → cli). Shipped CLI includes prebuilt client assets — no separate `build:client` after install.

```typescript
// hello.ts
import { ui } from '@close-by/clay';

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

Multi-page with shell:

```bash
bun run clay ./pages --app --title "My App"
```

Or library-style entry (`loadPages` + `ui.run({ app })`) — see [Getting started](./getting-started.md).

## Naming

Public Clay APIs and the wire protocol use **camelCase** (`onClick`, `bindValue`, `setText`, element `type: "button"`).

React/ShadCN components inside `@close-by/clay-client` stay PascalCase because React requires it — that layer is an implementation detail.
