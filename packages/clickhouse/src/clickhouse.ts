import { createClient, type ClickHouseClient } from '@clickhouse/client';
import { Connection } from './connection';
import type { ClickHouseConnectConfig } from './types';

type NamedEntry = {
  client: ClickHouseClient;
  connection: Connection;
  config: ClickHouseConnectConfig;
};

/**
 * Multi-connection ClickHouse manager — same shape as `@close-by/clay-duckdb`.
 */
export class ClickHouse {
  private readonly dbs = new Map<string, NamedEntry>();

  /** Open a ClickHouse HTTP client and register it under `name`. */
  async connect(name: string, config: ClickHouseConnectConfig): Promise<Connection> {
    if (this.dbs.has(name)) {
      throw new Error(`ClickHouse connection already exists: ${JSON.stringify(name)}`);
    }
    if (!config.url?.trim() && !config.client) {
      throw new Error('ClickHouse connect requires url (or an injected client)');
    }

    const client =
      config.client ??
      createClient({
        url: config.url,
        username: config.username ?? 'default',
        password: config.password ?? '',
        database: config.database,
        clickhouse_settings: config.clickhouse_settings as any,
      });

    const connection = new Connection(name, client);
    this.dbs.set(name, { client, connection, config });
    return connection;
  }

  /** Get an existing named connection. */
  db(name: string): Connection {
    const entry = this.dbs.get(name);
    if (!entry) throw new Error(`Unknown ClickHouse connection: ${JSON.stringify(name)}`);
    return entry.connection;
  }

  has(name: string): boolean {
    return this.dbs.has(name);
  }

  list(): string[] {
    return [...this.dbs.keys()];
  }

  async close(name: string): Promise<void> {
    const entry = this.dbs.get(name);
    if (!entry) return;
    this.dbs.delete(name);
    try {
      await entry.client.close();
    } catch {
      // already closed
    }
  }

  async closeAll(): Promise<void> {
    const names = this.list();
    for (const n of names) {
      await this.close(n);
    }
  }
}
