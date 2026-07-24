import { DuckDBInstance, type DuckDBConnection } from '@duckdb/node-api';
import { Connection } from './connection';
import { quoteIdent, quoteLiteral } from './sql';
import type { AttachOptions, AttachType } from './types';

type NamedEntry = {
  instance: DuckDBInstance;
  connection: Connection;
  raw: DuckDBConnection;
  path: string;
};

const EXTENSION_BY_TYPE: Partial<Record<AttachType, string>> = {
  sqlite: 'sqlite',
  postgres: 'postgres',
  mysql: 'mysql',
};

const loadedExtensions = new Set<string>();

async function ensureExtension(conn: DuckDBConnection, type: AttachType): Promise<void> {
  const ext = EXTENSION_BY_TYPE[type];
  if (!ext || loadedExtensions.has(ext)) return;
  await conn.run(`INSTALL ${ext}`);
  await conn.run(`LOAD ${ext}`);
  loadedExtensions.add(ext);
}

function buildAttachSql(opts: AttachOptions): string {
  const path = quoteLiteral(opts.path);
  const alias = quoteIdent(opts.alias);
  const parts: string[] = [];

  if (opts.type !== 'duckdb') {
    parts.push(`TYPE ${opts.type}`);
  }
  if (opts.readOnly) {
    parts.push('READ_ONLY');
  }

  if (parts.length === 0) {
    return `ATTACH ${path} AS ${alias}`;
  }
  return `ATTACH ${path} AS ${alias} (${parts.join(', ')})`;
}

/**
 * Multi-database DuckDB manager: named instances, ATTACH, and CRUD helpers.
 */
export class DuckDB {
  private readonly dbs = new Map<string, NamedEntry>();

  /** Open (or create) a DuckDB database and register it under `name`. */
  async connect(name: string, path: string = ':memory:'): Promise<Connection> {
    if (this.dbs.has(name)) {
      throw new Error(`DuckDB connection already exists: ${JSON.stringify(name)}`);
    }
    const instance = await DuckDBInstance.create(path);
    const raw = await instance.connect();
    const connection = new Connection(name, raw);
    this.dbs.set(name, { instance, connection, raw, path });
    return connection;
  }

  /** Get an existing named connection. */
  db(name: string): Connection {
    const entry = this.dbs.get(name);
    if (!entry) throw new Error(`Unknown DuckDB connection: ${JSON.stringify(name)}`);
    return entry.connection;
  }

  has(name: string): boolean {
    return this.dbs.has(name);
  }

  list(): string[] {
    return [...this.dbs.keys()];
  }

  /**
   * ATTACH another database onto a named instance.
   * Loads the matching extension (sqlite / postgres / mysql) when needed.
   */
  async attach(name: string, opts: AttachOptions): Promise<void> {
    const entry = this.dbs.get(name);
    if (!entry) throw new Error(`Unknown DuckDB connection: ${JSON.stringify(name)}`);
    if (!opts.alias?.trim()) throw new Error('attach requires a non-empty alias');
    if (!opts.path?.trim()) throw new Error('attach requires a non-empty path');

    await ensureExtension(entry.raw, opts.type);
    await entry.raw.run(buildAttachSql(opts));
  }

  async detach(name: string, alias: string): Promise<void> {
    const entry = this.dbs.get(name);
    if (!entry) throw new Error(`Unknown DuckDB connection: ${JSON.stringify(name)}`);
    await entry.raw.run(`DETACH ${quoteIdent(alias)}`);
  }

  async close(name: string): Promise<void> {
    const entry = this.dbs.get(name);
    if (!entry) return;
    this.dbs.delete(name);
    try {
      entry.raw.closeSync();
    } catch {
      // already closed
    }
    try {
      // DuckDBInstance may expose closeSync in newer Neo builds
      const inst = entry.instance as DuckDBInstance & { closeSync?: () => void };
      inst.closeSync?.();
    } catch {
      // ignore
    }
  }

  async closeAll(): Promise<void> {
    const names = this.list();
    for (const name of names) {
      await this.close(name);
    }
  }
}
