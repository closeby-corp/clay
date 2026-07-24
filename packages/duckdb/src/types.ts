/** Options for ATTACH of an external or sibling database. */
export type AttachType = 'duckdb' | 'sqlite' | 'postgres' | 'mysql';

export type AttachOptions = {
  /** Alias used in qualified names (`alias.table`). */
  alias: string;
  type: AttachType;
  /** File path (duckdb/sqlite) or connection string / DSN (postgres/mysql). */
  path: string;
  readOnly?: boolean;
};

export type SqlParams = Record<string, unknown>;

export type Row = Record<string, unknown>;
