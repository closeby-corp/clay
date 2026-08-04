# BadUI Documentation

Server-driven UI for TypeScript, inspired by [NiceGUI](https://nicegui.io/).

You write imperative `ui.*` code on the server. BadUI owns a per-client element tree and syncs it to a thin React + ShadCN client over WebSocket.

## Guides

| Doc | Description |
|-----|-------------|
| [Getting started](./getting-started.md) | Install, run the demo, create a page |
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
bun run build:client
bun run demo
# → http://localhost:4000
```

```typescript
import { ui } from '@badui/ui';

// pages/home.ts
export const pageMeta = { label: 'Home', icon: 'house', order: 0 };

ui.page('/', () => {
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

```typescript
// main.ts
await ui.loadPages(new URL('./pages', import.meta.url));

ui.run({
  port: 4000,
  title: 'My App',
  app: { title: 'My App', nav: ui.navFromPages() },
});
```

## Naming

Public BadUI APIs and the wire protocol use **camelCase** (`onClick`, `bindValue`, `setText`, element `type: "button"`).

React/ShadCN components inside `@badui/client` stay PascalCase because React requires it — that layer is an implementation detail.
