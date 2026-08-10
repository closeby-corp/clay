# Kibana (`@clay/kibana`)

Authenticated (or internal) Kibana REST client: arbitrary API calls, Elasticsearch via console proxy or `/elasticsearch`, and `search_after` pagination for walking every matching log line.

```typescript
import { Kibana } from '@clay/kibana';

// Modern Kibana (console proxy)
const kbn = new Kibana({
  baseUrl: 'https://kibana.example.com',
  apiKey: process.env.KIBANA_API_KEY!, // or username + password
  space: 'sales', // optional
});

// Kibana 6.x style (same as `…/elasticsearch/{index}/_search`)
const logs = new Kibana({
  baseUrl: 'https://kibana.internal.factsandit.pt',
  kbnVersion: '6.8.0',
  esTransport: 'path', // → /elasticsearch/…
});
```

## Auth & headers

| Option | Description |
|--------|-------------|
| `apiKey` | `Authorization: ApiKey …` (optional) |
| `username` + `password` | `Authorization: Basic …` (optional) |
| `kbnVersion` | Sets `kbn-version` (needed on older Kibana ES proxies) |
| `space` | Prefixes Kibana API paths with `/s/{space}` |
| `headers` | Extra headers on every request |
| `fetch` | Inject a custom `fetch` (tests) |

Every request also sends `kbn-xsrf: true`.

## Elasticsearch transport

| `esTransport` | Behavior |
|---------------|----------|
| `'console'` (default) | `POST /api/console/proxy?path=…&method=…` |
| `'path'` | `{esPathPrefix}/{index}/_search` (default prefix `/elasticsearch`) |

```typescript
const result = await logs.search('logstash-production-logback-*', {
  query: { match_all: {} },
  size: 10,
});

await logs.es('GET', '_cluster/health');
```

## Paginate every hit (`search_after`)

```typescript
for await (const hit of logs.paginateSearch(index, body, { pageSize: 1000 })) {
  // …
}
```

## Guided query builder

Chain filters instead of hand-writing Elasticsearch JSON:

```typescript
type LogLine = { '@timestamp': string; message: string };

for await (const hit of logs
  .query<LogLine>('logstash-production-logback-*')
  .lastDays(1) // or .between(start, end)
  .match('*receivePartnerEvent*')
  .exclude('*ag_ibersol_webhook_notify_queue*')
  .select('@timestamp', 'message')
  .pageSize(1000)
  .stream()) {
  console.log(hit._source?.message);
}

// Or collect sources
const lines = await logs
  .query<LogLine>('logstash-production-logback-*')
  .between(start, end)
  .match('*receivePartnerEvent*')
  .select('@timestamp', 'message')
  .sources();
```

| Method | Purpose |
|--------|---------|
| `from` / `to` / `between` / `lastDays` | `@timestamp` range (override field with `timeField`) |
| `match(query, field?)` | `query_string` must (default field `message`) |
| `exclude(query, field?)` | `query_string` must_not |
| `term` / `where` / `whereNot` | Exact term or raw clauses |
| `select(...fields)` | `_source` filter |
| `pageSize` / `sort` | Pagination controls |
| `body()` | Inspect built ES JSON |
| `first()` / `stream()` / `all()` / `sources()` | Execute |
| `toParquet(path)` | Export all hits to a Parquet file (via DuckDB) |

### Export to Parquet

```typescript
const { path, rows } = await logs
  .query('logstash-production-logback-*')
  .lastDays(1)
  .match('*receivePartnerEvent*')
  .select('@timestamp', 'message')
  .toParquet('./data/logs.parquet');

// Later in DuckDB:
// SELECT * FROM 'data/logs.parquet'
// or COPY / CREATE TABLE … AS SELECT * FROM 'data/logs.parquet'
```

Options: optional `map(hit => row)` for a custom shape. By default each Parquet row is the document **`_source` only** (no `_id`, `_index`, `_type`, `_score`, or `sort`).

```sql
SELECT message, "@timestamp" FROM 'data/logs.parquet'
```

## Raw Kibana REST

```typescript
const spaces = await kbn.request('GET', '/api/spaces/space');
```

Failures throw `KibanaError` with `status` and parsed `body`.

## Saved Objects

```typescript
const found = await kbn.findSavedObjects({
  type: ['dashboard', 'visualization'],
  search: 'Sales',
  perPage: 20,
});

const dash = await kbn.getSavedObject('dashboard', 'my-dashboard-id');
```
