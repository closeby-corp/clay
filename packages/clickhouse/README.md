# `@close-by/clay-clickhouse`

Multi-connection ClickHouse helpers for Clay apps (same shape as `@close-by/clay-duckdb`).

```bash
bun add @close-by/clay-clickhouse
```

```typescript
import { ClickHouse } from '@close-by/clay-clickhouse';

const ch = new ClickHouse();
await ch.connect('analytics', {
  url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
  username: 'default',
  password: '',
  database: 'analytics',
});

const rows = await ch.db('analytics').query('SELECT 1 AS n');
```

Full API: [docs/clickhouse.md](../../docs/clickhouse.md) in the Clay repo.

**Note:** Prefer running Clay with the reactive-let Bun loader **off** (the CLI default) when depending on `@clickhouse/client`, so CJS named-export interop stays reliable.
