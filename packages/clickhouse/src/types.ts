export type ClickHouseConnectConfig = {
  /** ClickHouse HTTP URL, e.g. `http://localhost:8123`. */
  url: string;
  username?: string;
  password?: string;
  database?: string;
  /** Extra ClickHouse settings passed to the official client. */
  clickhouse_settings?: Record<string, unknown>;
  /** Inject a client (tests). */
  client?: import('@clickhouse/client').ClickHouseClient;
};

export type Row = Record<string, unknown>;

export type SqlParams = Record<string, unknown>;
