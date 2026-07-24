import type { SqlParams } from './types';

/** Quote a DuckDB identifier (supports `schema.table`). */
export function quoteIdent(name: string): string {
  return name
    .split('.')
    .map((part) => {
      if (!part) throw new Error(`Invalid identifier: ${JSON.stringify(name)}`);
      return `"${part.replace(/"/g, '""')}"`;
    })
    .join('.');
}

function assertNonEmpty(obj: Record<string, unknown>, kind: string): string[] {
  const keys = Object.keys(obj);
  if (keys.length === 0) throw new Error(`${kind} requires at least one column`);
  return keys;
}

/** Build `INSERT INTO table (cols) VALUES ($c0, …)` and bind map. */
export function buildInsert(
  table: string,
  row: Record<string, unknown>,
): { sql: string; params: SqlParams } {
  const keys = assertNonEmpty(row, 'insert');
  const cols = keys.map(quoteIdent).join(', ');
  const placeholders = keys.map((_, i) => `$c${i}`).join(', ');
  const params: SqlParams = {};
  for (let i = 0; i < keys.length; i++) {
    params[`c${i}`] = row[keys[i]!];
  }
  return {
    sql: `INSERT INTO ${quoteIdent(table)} (${cols}) VALUES (${placeholders})`,
    params,
  };
}

/** Build `UPDATE table SET … WHERE …` and bind map. */
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
    setParts.push(`${quoteIdent(key)} = $${p}`);
    params[p] = set[key];
  }

  const whereParts: string[] = [];
  for (let i = 0; i < whereKeys.length; i++) {
    const key = whereKeys[i]!;
    const p = `w${i}`;
    whereParts.push(`${quoteIdent(key)} = $${p}`);
    params[p] = where[key];
  }

  return {
    sql: `UPDATE ${quoteIdent(table)} SET ${setParts.join(', ')} WHERE ${whereParts.join(' AND ')}`,
    params,
  };
}

/** Build `DELETE FROM table WHERE …` and bind map. */
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
    whereParts.push(`${quoteIdent(key)} = $${p}`);
    params[p] = where[key];
  }

  return {
    sql: `DELETE FROM ${quoteIdent(table)} WHERE ${whereParts.join(' AND ')}`,
    params,
  };
}

/** Escape a string literal for ATTACH path / DSN. */
export function quoteLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
