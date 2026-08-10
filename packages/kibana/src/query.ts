import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { DuckDB } from '@clay/duckdb';
import type { Kibana } from './kibana';
import { sourceOnly, sqlQuote, type ToParquetOptions, type ToParquetResult } from './parquet';
import type { EsHit, EsSearchBody, EsSearchResponse, PaginateSearchOptions } from './types';

type DateInput = Date | string | number;

function toIso(value: DateInput): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  // date-only → start/end of day handled by callers when needed; plain parse otherwise
  return new Date(value).toISOString();
}

function startOfUtcDay(value: DateInput): Date {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function endOfUtcDay(value: DateInput): Date {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

/**
 * Guided Elasticsearch query builder — chain filters, then `.stream()` / `.all()` / `.first()`.
 */
export class QueryBuilder<T = Record<string, unknown>> {
  private indexName: string;
  private timeFieldName = '@timestamp';
  private rangeGte?: string;
  private rangeLte?: string;
  private readonly must: unknown[] = [];
  private readonly mustNot: unknown[] = [];
  private sourceFields?: string[] | boolean;
  private pageSizeValue = 1000;
  private sortValue: unknown = [
    { '@timestamp': { order: 'asc' } },
    { _doc: { order: 'asc' } },
  ];
  private extraBody: EsSearchBody = {};

  constructor(
    private readonly client: Kibana,
    indexName: string,
  ) {
    this.indexName = indexName;
  }

  /** Override the index pattern / name. */
  index(name: string): this {
    this.indexName = name;
    return this;
  }

  /** Field used by `from` / `to` / `between` / `lastDays`. Default: `@timestamp`. */
  timeField(field: string): this {
    this.timeFieldName = field;
    this.sortValue = [{ [field]: { order: 'asc' } }, { _doc: { order: 'asc' } }];
    return this;
  }

  /** Range start (inclusive). Accepts `Date`, ISO string, or epoch ms. */
  from(value: DateInput): this {
    this.rangeGte = toIso(value);
    return this;
  }

  /** Range end (inclusive). */
  to(value: DateInput): this {
    this.rangeLte = toIso(value);
    return this;
  }

  /** Convenience: `from` + `to`. */
  between(start: DateInput, end: DateInput): this {
    return this.from(start).to(end);
  }

  /**
   * Last N UTC days ending today (or `end`).
   * Start snaps to 00:00:00.000Z; end to 23:59:59.999Z of the end day.
   */
  lastDays(days: number, end: DateInput = new Date()): this {
    const endDate = endOfUtcDay(end);
    const startDate = startOfUtcDay(new Date(endDate.getTime() - days * 86_400_000));
    return this.between(startDate, endDate);
  }

  /** `query_string` must clause. Default field: `message`. */
  match(query: string, field = 'message'): this {
    this.must.push({ query_string: { query, default_field: field } });
    return this;
  }

  /** `query_string` must_not clause. Default field: `message`. */
  exclude(query: string, field = 'message'): this {
    this.mustNot.push({ query_string: { query, default_field: field } });
    return this;
  }

  /** Exact term filter. */
  term(field: string, value: string | number | boolean): this {
    this.must.push({ term: { [field]: value } });
    return this;
  }

  /** Free-form `must` clause (raw Elasticsearch). */
  where(clause: unknown): this {
    this.must.push(clause);
    return this;
  }

  /** Free-form `must_not` clause. */
  whereNot(clause: unknown): this {
    this.mustNot.push(clause);
    return this;
  }

  /** Limit `_source` fields. */
  select(...fields: string[]): this {
    this.sourceFields = fields;
    return this;
  }

  /** Hits per page for pagination. Default: `1000`. */
  pageSize(size: number): this {
    this.pageSizeValue = size;
    return this;
  }

  /** Override sort (also used as `search_after` keys). */
  sort(sort: unknown): this {
    this.sortValue = sort;
    return this;
  }

  /** Merge extra body keys into the search request. */
  extras(body: EsSearchBody): this {
    this.extraBody = { ...this.extraBody, ...body };
    return this;
  }

  /** Built Elasticsearch search body (without pagination cursor). */
  body(): EsSearchBody {
    const must = [...this.must];
    if (this.rangeGte != null || this.rangeLte != null) {
      const range: Record<string, string> = {};
      if (this.rangeGte != null) range.gte = this.rangeGte;
      if (this.rangeLte != null) range.lte = this.rangeLte;
      must.push({ range: { [this.timeFieldName]: range } });
    }

    const bool: Record<string, unknown> = {};
    if (must.length) bool.must = must;
    if (this.mustNot.length) bool.must_not = this.mustNot;

    const query =
      must.length || this.mustNot.length ? { bool } : { match_all: {} };

    const body: EsSearchBody = {
      ...this.extraBody,
      query,
    };
    if (this.sourceFields !== undefined) body._source = this.sourceFields;
    return body;
  }

  private pageOptions(): PaginateSearchOptions {
    return { pageSize: this.pageSizeValue, sort: this.sortValue };
  }

  /** Single page (`size` = pageSize). */
  first(): Promise<EsSearchResponse<T>> {
    return this.client.search<T>(this.indexName, {
      ...this.body(),
      size: this.pageSizeValue,
      sort: this.sortValue,
    });
  }

  /** Async iterator over every matching hit (`search_after`). */
  stream(): AsyncGenerator<EsHit<T>> {
    return this.client.paginateSearch<T>(this.indexName, this.body(), this.pageOptions());
  }

  /** Collect every matching hit. */
  all(): Promise<EsHit<T>[]> {
    return this.client.searchAll<T>(this.indexName, this.body(), this.pageOptions());
  }

  /** Collect every `_source` (skips hits without `_source`). */
  async sources(): Promise<T[]> {
    const out: T[] = [];
    for await (const hit of this.stream()) {
      if (hit._source !== undefined) out.push(hit._source);
    }
    return out;
  }

  /**
   * Run the query (full `search_after` pagination) and write hits to a Parquet file via DuckDB.
   *
   * @example
   * await logs.query('logstash-*').lastDays(1).match('*foo*').toParquet('./logs.parquet');
   */
  async toParquet(path: string, options: ToParquetOptions<T> = {}): Promise<ToParquetResult> {
    const map = options.map ?? sourceOnly;

    const tmp = await mkdtemp(join(tmpdir(), 'clay-kibana-'));
    const ndjsonPath = join(tmp, 'hits.ndjson');
    let rows = 0;

    try {
      await writeFile(ndjsonPath, '');
      const chunks: string[] = [];
      const flushEvery = 500;

      const flush = async () => {
        if (!chunks.length) return;
        await writeFile(ndjsonPath, chunks.join('\n') + '\n', { flag: 'a' });
        chunks.length = 0;
      };

      for await (const hit of this.stream()) {
        chunks.push(JSON.stringify(map(hit)));
        rows += 1;
        if (chunks.length >= flushEvery) await flush();
      }
      await flush();

      if (rows === 0) {
        throw new Error('toParquet: query returned no hits');
      }

      await mkdir(dirname(path), { recursive: true });

      const duck = new DuckDB();
      try {
        const db = await duck.connect('export');
        const src = sqlQuote(ndjsonPath);
        const dest = sqlQuote(path);
        await db.exec(`CREATE TABLE export_hits AS SELECT * FROM read_ndjson_auto(${src})`);
        await db.exec(`COPY export_hits TO ${dest} (FORMAT PARQUET)`);
      } finally {
        await duck.closeAll();
      }

      return { path, rows };
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  }

  /** `for await` support: same as `.stream()`. */
  [Symbol.asyncIterator](): AsyncIterator<EsHit<T>> {
    return this.stream();
  }
}
