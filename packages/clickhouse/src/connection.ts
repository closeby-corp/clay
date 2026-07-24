import type { ClickHouseClient } from '@clickhouse/client';
import { buildDelete, buildInsert, buildUpdate } from './sql';
import type { Row, SqlParams } from './types';

export class Connection {
  constructor(
    readonly name: string,
    private readonly client: ClickHouseClient,
  ) {}

  /** Underlying `@clickhouse/client` instance. */
  get raw(): ClickHouseClient {
    return this.client;
  }

  /** Run SQL that does not return rows (DDL, DML, mutations). */
  async exec(sql: string, params?: SqlParams): Promise<void> {
    await this.client.command({
      query: sql,
      query_params: params,
    });
  }

  /** Run a query and return plain row objects. */
  async query<T extends Row = Row>(sql: string, params?: SqlParams): Promise<T[]> {
    const result = await this.client.query({
      query: sql,
      format: 'JSONEachRow',
      query_params: params,
    });
    return result.json<T>();
  }

  /** First row or `null`. */
  async queryOne<T extends Row = Row>(sql: string, params?: SqlParams): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  /**
   * Stream rows for large SELECTs.
   * (Extra vs DuckDB — useful for ClickHouse result sets.)
   */
  async *stream<T extends Row = Row>(sql: string, params?: SqlParams): AsyncGenerator<T> {
    const result = await this.client.query({
      query: sql,
      format: 'JSONEachRow',
      query_params: params,
    });
    const readable = result.stream<T>();
    for await (const chunk of readable) {
      for (const row of chunk) {
        yield row.json();
      }
    }
  }

  async insert(table: string, row: Record<string, unknown>): Promise<void> {
    const { sql, params } = buildInsert(table, row);
    await this.exec(sql, params);
  }

  async update(
    table: string,
    set: Record<string, unknown>,
    where: Record<string, unknown>,
  ): Promise<void> {
    const { sql, params } = buildUpdate(table, set, where);
    await this.exec(sql, params);
  }

  async delete(table: string, where: Record<string, unknown>): Promise<void> {
    const { sql, params } = buildDelete(table, where);
    await this.exec(sql, params);
  }
}
