# BadUI Documentation

Server-driven UI for TypeScript, inspired by [NiceGUI](https://nicegui.io/).

You write imperative `ui.*` code on the server. BadUI owns a per-client element tree and syncs it to a thin React + ShadCN client over WebSocket.

## Guides

| Doc | Description |
|-----|-------------|
| [Getting started](./getting-started.md) | Install, `badui` CLI, create a page |
| [Concepts](./concepts.md) | Mental model: sessions, elements, patches, refreshable |
| [API reference](./api.md) | `ui.*`, `Element` methods, `reactive`, helpers |
| [Elements](./elements.md) | All element types and props |
| [WebSocket protocol](./protocol.md) | Client ↔ server message formats |
| [Architecture](./architecture.md) | Packages, data flow, and ownership |
| [Examples](./examples.md) | Demo apps and patterns |
| [DuckDB](./duckdb.md) | Multi-DB DuckDB wrapper (`@badui/duckdb`) |
| [Kibana](./kibana.md) | Kibana REST + ES search (`@badui/kibana`) |
| [ClickHouse](./clickhouse.md) | Multi-connection ClickHouse wrapper (`@badui/clickhouse`) |

## Quick start

```bash
bun install
bun run build:client   # monorepo: build + copy client into @badui/cli
bun run badui hello.ts
# → http://localhost:3000
```

Outside the monorepo: `bun run pack:publishable` then install the `dist-pack/*.tgz` set (see [Getting started](./getting-started.md)), or `bun add @badui/cli @badui/ui` once published. Shipped CLI includes prebuilt client assets — no separate `build:client` after install.

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

Multi-page with shell:

```bash
bun run badui ./pages --app --title "My App"
```

Or library-style entry (`loadPages` + `ui.run({ app })`) — see [Getting started](./getting-started.md).

## Naming

Public BadUI APIs and the wire protocol use **camelCase** (`onClick`, `bindValue`, `setText`, element `type: "button"`).

React/ShadCN components inside `@badui/client` stay PascalCase because React requires it — that layer is an implementation detail.
