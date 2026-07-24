import type { DuckDBConnection } from '@duckdb/node-api';
import { buildDelete, buildInsert, buildUpdate } from './sql';
import type { Row, SqlParams } from './types';

export class Connection {
  constructor(
    readonly name: string,
    private readonly conn: DuckDBConnection,
  ) {}

  /** Underlying Neo connection for advanced use. */
  get raw(): DuckDBConnection {
    return this.conn;
  }

  /** Run SQL that does not return rows (DDL, DML). */
  async exec(sql: string, params?: SqlParams): Promise<void> {
    if (params && Object.keys(params).length > 0) {
      await this.conn.run(sql, params as Record<string, any>);
    } else {
      await this.conn.run(sql);
    }
  }

  /** Run a query and return plain JSON row objects. */
  async query<T extends Row = Row>(sql: string, params?: SqlParams): Promise<T[]> {
    const reader =
      params && Object.keys(params).length > 0
        ? await this.conn.runAndReadAll(sql, params as Record<string, any>)
        : await this.conn.runAndReadAll(sql);
    return reader.getRowObjectsJson() as T[];
  }

  /** First row or `null`. */
  async queryOne<T extends Row = Row>(sql: string, params?: SqlParams): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
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
