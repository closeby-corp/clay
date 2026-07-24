import { describe, expect, test } from 'bun:test';
import { buildDelete, buildInsert, buildUpdate, quoteIdent, quoteLiteral } from './sql';

describe('sql helpers', () => {
  test('quoteIdent escapes and supports schema.table', () => {
    expect(quoteIdent('users')).toBe('"users"');
    expect(quoteIdent('legacy.users')).toBe('"legacy"."users"');
    expect(quoteIdent('weird"name')).toBe('"weird""name"');
  });

  test('quoteLiteral escapes quotes', () => {
    expect(quoteLiteral("o'clock")).toBe("'o''clock'");
  });

  test('buildInsert', () => {
    const { sql, params } = buildInsert('users', { id: 1, name: 'Ada' });
    expect(sql).toBe('INSERT INTO "users" ("id", "name") VALUES ($c0, $c1)');
    expect(params).toEqual({ c0: 1, c1: 'Ada' });
  });

  test('buildUpdate requires where', () => {
    expect(() => buildUpdate('users', { name: 'x' }, {})).toThrow(/where/);
    const { sql, params } = buildUpdate('users', { name: 'Ada' }, { id: 1 });
    expect(sql).toBe('UPDATE "users" SET "name" = $s0 WHERE "id" = $w0');
    expect(params).toEqual({ s0: 'Ada', w0: 1 });
  });

  test('buildDelete requires where', () => {
    expect(() => buildDelete('users', {})).toThrow(/where/);
    const { sql, params } = buildDelete('users', { id: 1 });
    expect(sql).toBe('DELETE FROM "users" WHERE "id" = $w0');
    expect(params).toEqual({ w0: 1 });
  });
});
