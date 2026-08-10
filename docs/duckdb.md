# DuckDB (`@clay/duckdb`)

Multi-database DuckDB wrapper: named instances, `ATTACH` for DuckDB/SQLite/Postgres/MySQL, and insert/update/delete helpers.

```bash
bun add @clay/duckdb   # or depend on workspace:* inside this monorepo
```

## Connect multiple databases

```typescript
import { DuckDB } from '@clay/duckdb';

const duck = new DuckDB();

await duck.connect('app', './data/app.duckdb');
await duck.connect('scratch', ':memory:');

const app = duck.db('app');
await app.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  email VARCHAR
)`);
```

| Method | Description |
|--------|-------------|
| `connect(name, path?)` | Open/create a DuckDB file (default `:memory:`) |
| `db(name)` | Get a named `Connection` |
| `has(name)` / `list()` | Registry helpers |
| `close(name)` / `closeAll()` | Disconnect and drop from registry |

## CRUD

```typescript
await app.insert('users', { id: 1, name: 'Ada', email: 'a@x.com' });
await app.update('users', { name: 'Ada Lovelace' }, { id: 1 });
await app.delete('users', { id: 1 });

const rows = await app.query<{ id: number; name: string }>(
  'SELECT * FROM users WHERE id = $id',
  { id: 1 },
);
const one = await app.queryOne('SELECT * FROM users WHERE id = $id', { id: 1 });
```

`update` and `delete` require a non-empty `where` object (safety guard).

Use `app.raw` for the underlying `@duckdb/node-api` connection when you need appenders or streaming.

## ATTACH external databases

```typescript
await duck.attach('app', {
  alias: 'legacy',
  type: 'sqlite',          // 'duckdb' | 'sqlite' | 'postgres' | 'mysql'
  path: './legacy.sqlite', // file path or DSN for postgres/mysql
  readOnly: false,
});

await app.query('SELECT * FROM legacy.users');
await app.insert('legacy.users', { id: 2, name: 'Grace' });

await duck.detach('app', 'legacy');
```

Extensions (`sqlite`, `postgres`, `mysql`) are `INSTALL`/`LOAD`ed once per process when first needed. Prefer `type: 'duckdb'` for sibling DuckDB files (no extension).
