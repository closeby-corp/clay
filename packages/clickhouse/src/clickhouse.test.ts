import { describe, expect, test } from 'bun:test';
import type { ClickHouseClient } from '@clickhouse/client';
import { ClickHouse } from './clickhouse';
import { buildDelete, buildInsert, buildUpdate, quoteIdent } from './sql';

function mockClient(handlers: {
  query?: (args: any) => Promise<any>;
  command?: (args: any) => Promise<any>;
  close?: () => Promise<void>;
}): ClickHouseClient {
  return {
    query: handlers.query ?? (async () => ({ json: async () => [], stream: () => (async function* () {})() })),
    command: handlers.command ?? (async () => ({})),
    close: handlers.close ?? (async () => {}),
  } as unknown as ClickHouseClient;
}

describe('sql helpers', () => {
  test('quoteIdent', () => {
    expect(quoteIdent('users')).toBe('`users`');
    expect(quoteIdent('db.users')).toBe('`db`.`users`');
  });

  test('buildInsert uses typed placeholders', () => {
    const { sql, params } = buildInsert('users', { id: 1, name: 'Ada' });
    expect(sql).toBe('INSERT INTO `users` (`id`, `name`) VALUES ({c0:Int64}, {c1:String})');
    expect(params).toEqual({ c0: 1, c1: 'Ada' });
  });

  test('buildUpdate/delete require where and use ALTER mutations', () => {
    expect(() => buildUpdate('users', { name: 'x' }, {})).toThrow(/where/);
    expect(() => buildDelete('users', {})).toThrow(/where/);

    const u = buildUpdate('users', { name: 'Ada' }, { id: 1 });
    expect(u.sql).toBe(
      'ALTER TABLE `users` UPDATE `name` = {s0:String} WHERE `id` = {w0:Int64}',
    );

    const d = buildDelete('users', { id: 1 });
    expect(d.sql).toBe('ALTER TABLE `users` DELETE WHERE `id` = {w0:Int64}');
  });
});

describe('ClickHouse manager', () => {
  test('connects multiple named clients independently', async () => {
    const commands: string[] = [];
    const ch = new ClickHouse();

    const a = await ch.connect('a', {
      url: 'http://a',
      client: mockClient({
        command: async ({ query }) => {
          commands.push(`a:${query}`);
        },
      }),
    });
    const b = await ch.connect('b', {
      url: 'http://b',
      client: mockClient({
        command: async ({ query }) => {
          commands.push(`b:${query}`);
        },
      }),
    });

    await a.exec('SELECT 1');
    await b.exec('SELECT 2');
    expect(commands).toEqual(['a:SELECT 1', 'b:SELECT 2']);
    expect(ch.list().sort()).toEqual(['a', 'b']);
    expect(ch.db('a')).toBe(a);
    expect(ch.has('a')).toBe(true);
  });

  test('query / queryOne / CRUD round-trip shape', async () => {
    const seen: any[] = [];
    const ch = new ClickHouse();
    const db = await ch.connect('app', {
      url: 'http://x',
      client: mockClient({
        query: async (args) => {
          seen.push(args);
          return { json: async () => [{ id: 1, name: 'Ada' }] };
        },
        command: async (args) => {
          seen.push(args);
        },
      }),
    });

    expect(await db.query('SELECT * FROM users WHERE id = {id:Int64}', { id: 1 })).toEqual([
      { id: 1, name: 'Ada' },
    ]);
    expect(await db.queryOne('SELECT * FROM users')).toEqual({ id: 1, name: 'Ada' });

    await db.insert('users', { id: 2, name: 'Grace' });
    await db.update('users', { name: 'Grace Hopper' }, { id: 2 });
    await db.delete('users', { id: 2 });

    expect(seen.some((s) => String(s.query).startsWith('INSERT INTO'))).toBe(true);
    expect(seen.some((s) => String(s.query).startsWith('ALTER TABLE `users` UPDATE'))).toBe(true);
    expect(seen.some((s) => String(s.query).startsWith('ALTER TABLE `users` DELETE'))).toBe(true);
  });

  test('stream yields each row', async () => {
    const ch = new ClickHouse();
    const db = await ch.connect('app', {
      url: 'http://x',
      client: mockClient({
        query: async () => ({
          stream: () =>
            (async function* () {
              yield [{ json: () => ({ id: 1 }) }, { json: () => ({ id: 2 }) }];
            })(),
        }),
      }),
    });

    const ids: number[] = [];
    for await (const row of db.stream<{ id: number }>('SELECT id FROM t')) {
      ids.push(row.id);
    }
    expect(ids).toEqual([1, 2]);
  });

  test('close removes from registry', async () => {
    let closed = false;
    const ch = new ClickHouse();
    await ch.connect('x', {
      url: 'http://x',
      client: mockClient({ close: async () => { closed = true; } }),
    });
    await ch.close('x');
    expect(closed).toBe(true);
    expect(ch.has('x')).toBe(false);
    expect(() => ch.db('x')).toThrow(/Unknown/);
  });

  test('connect rejects duplicate names', async () => {
    const ch = new ClickHouse();
    await ch.connect('app', { url: 'http://x', client: mockClient({}) });
    await expect(ch.connect('app', { url: 'http://y', client: mockClient({}) })).rejects.toThrow(
      /already exists/,
    );
  });
});
