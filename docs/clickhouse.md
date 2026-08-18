# ClickHouse (`@close-by/clay-clickhouse`)

Multi-connection ClickHouse wrapper with the same shape as [`@close-by/clay-duckdb`](./duckdb.md): named clients, `exec` / `query` / `queryOne`, and insert/update/delete helpers. Also includes `stream` for large SELECTs.

```typescript
import { ClickHouse } from '@close-by/clay-clickhouse';

const ch = new ClickHouse();

await ch.connect('analytics', {
  url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER ?? 'default',
  password: process.env.CLICKHOUSE_PASSWORD ?? '',
  database: 'analytics',
});

const db = ch.db('analytics');
```

| Method | Description |
|--------|-------------|
| `connect(name, config)` | Open HTTP client and register under `name` |
| `db(name)` | Get a named `Connection` |
| `has(name)` / `list()` | Registry helpers |
| `close(name)` / `closeAll()` | Disconnect and drop from registry |

## Query / exec

ClickHouse query parameters use `{name:Type}` in SQL:

```typescript
const rows = await db.query<{ id: number; name: string }>(
  `SELECT id, name FROM users WHERE day = {day:String}`,
  { day: '2026-07-01' },
);

const one = await db.queryOne('SELECT count() AS c FROM users');
await db.exec('CREATE TABLE IF NOT EXISTS scratch (id UInt64) ENGINE = Memory');

for await (const row of db.stream('SELECT * FROM events')) {
  // large result sets
}
```

## CRUD

```typescript
await db.insert('users', { id: 1, name: 'Ada' });
await db.update('users', { name: 'Ada Lovelace' }, { id: 1 });
await db.delete('users', { id: 1 });
```

`update` / `delete` require a non-empty `where` and emit ClickHouse mutations (`ALTER TABLE … UPDATE/DELETE`).

Use `db.raw` for the underlying `@clickhouse/client` when needed.

```typescript
await ch.closeAll();
```
