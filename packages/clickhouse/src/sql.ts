import type { SqlParams } from './types';

/** Quote a ClickHouse identifier (supports `db.table`). */
export function quoteIdent(name: string): string {
  return name
    .split('.')
    .map((part) => {
      if (!part) throw new Error(`Invalid identifier: ${JSON.stringify(name)}`);
      return `\`${part.replace(/`/g, '``')}\``;
    })
    .join('.');
}

function assertNonEmpty(obj: Record<string, unknown>, kind: string): string[] {
  const keys = Object.keys(obj);
  if (keys.length === 0) throw new Error(`${kind} requires at least one column`);
  return keys;
}

/** Infer a ClickHouse query-param type for binding. */
export function inferParamType(value: unknown): string {
  if (typeof value === 'boolean') return 'Bool';
  if (typeof value === 'number') return Number.isInteger(value) ? 'Int64' : 'Float64';
  if (typeof value === 'bigint') return 'Int64';
  if (value instanceof Date) return 'DateTime';
  if (Array.isArray(value)) return 'Array(String)';
  return 'String';
}

function bindPlaceholder(name: string, value: unknown): string {
  return `{${name}:${inferParamType(value)}}`;
}

/** Build `INSERT INTO table (cols) VALUES (…)`. */
export function buildInsert(
  table: string,
  row: Record<string, unknown>,
): { sql: string; params: SqlParams } {
  const keys = assertNonEmpty(row, 'insert');
  const cols = keys.map(quoteIdent).join(', ');
  const params: SqlParams = {};
  const placeholders: string[] = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!;
    const p = `c${i}`;
    params[p] = row[key];
    placeholders.push(bindPlaceholder(p, row[key]));
  }
  return {
    sql: `INSERT INTO ${quoteIdent(table)} (${cols}) VALUES (${placeholders.join(', ')})`,
    params,
  };
}

/** Build `ALTER TABLE … UPDATE … WHERE …` (ClickHouse mutation). */
export function buildUpdate(
  table: string,
  set: Record<string, unknown>,
  where: Record<string, unknown>,
): { sql: string; params: SqlParams } {
  const setKeys = assertNonEmpty(set, 'update set');
  const whereKeys = Object.keys(where);
  if (whereKeys.length === 0) {
    throw new Error('update requires a non-empty where clause');
  }

  const params: SqlParams = {};
  const setParts: string[] = [];
  for (let i = 0; i < setKeys.length; i++) {
    const key = setKeys[i]!;
    const p = `s${i}`;
    params[p] = set[key];
    setParts.push(`${quoteIdent(key)} = ${bindPlaceholder(p, set[key])}`);
  }

  const whereParts: string[] = [];
  for (let i = 0; i < whereKeys.length; i++) {
    const key = whereKeys[i]!;
    const p = `w${i}`;
    params[p] = where[key];
    whereParts.push(`${quoteIdent(key)} = ${bindPlaceholder(p, where[key])}`);
  }

  return {
    sql: `ALTER TABLE ${quoteIdent(table)} UPDATE ${setParts.join(', ')} WHERE ${whereParts.join(' AND ')}`,
    params,
  };
}

/** Build `ALTER TABLE … DELETE WHERE …` (ClickHouse mutation). */
export function buildDelete(
  table: string,
  where: Record<string, unknown>,
): { sql: string; params: SqlParams } {
  const whereKeys = Object.keys(where);
  if (whereKeys.length === 0) {
    throw new Error('delete requires a non-empty where clause');
  }

  const params: SqlParams = {};
  const whereParts: string[] = [];
  for (let i = 0; i < whereKeys.length; i++) {
    const key = whereKeys[i]!;
    const p = `w${i}`;
    params[p] = where[key];
    whereParts.push(`${quoteIdent(key)} = ${bindPlaceholder(p, where[key])}`);
  }

  return {
    sql: `ALTER TABLE ${quoteIdent(table)} DELETE WHERE ${whereParts.join(' AND ')}`,
    params,
  };
}
