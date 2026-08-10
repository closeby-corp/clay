import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DuckDB } from './duckdb';

describe('DuckDB manager', () => {
  const ducks: DuckDB[] = [];

  afterEach(async () => {
    for (const duck of ducks.splice(0)) {
      await duck.closeAll();
    }
  });

  function create(): DuckDB {
    const duck = new DuckDB();
    ducks.push(duck);
    return duck;
  }

  test('connects multiple named databases independently', async () => {
    const duck = create();
    const a = await duck.connect('a');
    const b = await duck.connect('b');

    await a.exec('CREATE TABLE t (id INTEGER, name VARCHAR)');
    await b.exec('CREATE TABLE t (id INTEGER, name VARCHAR)');
    await a.insert('t', { id: 1, name: 'from-a' });
    await b.insert('t', { id: 2, name: 'from-b' });

    expect(await a.query('SELECT * FROM t')).toEqual([{ id: 1, name: 'from-a' }]);
    expect(await b.query('SELECT * FROM t')).toEqual([{ id: 2, name: 'from-b' }]);
    expect(duck.list().sort()).toEqual(['a', 'b']);
    expect(duck.has('a')).toBe(true);
    expect(duck.db('a')).toBe(a);
  });

  test('CRUD round-trip', async () => {
    const duck = create();
    const db = await duck.connect('app');
    await db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR, email VARCHAR)');

    await db.insert('users', { id: 1, name: 'Ada', email: 'a@x.com' });
    expect(await db.queryOne('SELECT * FROM users WHERE id = $id', { id: 1 })).toEqual({
      id: 1,
      name: 'Ada',
      email: 'a@x.com',
    });

    await db.update('users', { name: 'Ada Lovelace', email: 'ada@x.com' }, { id: 1 });
    expect(await db.queryOne<{ name: string }>('SELECT name FROM users WHERE id = 1')).toEqual({
      name: 'Ada Lovelace',
    });

    await db.delete('users', { id: 1 });
    expect(await db.query('SELECT * FROM users')).toEqual([]);
  });

  test('update/delete without where throw', async () => {
    const duck = create();
    const db = await duck.connect('app');
    await db.exec('CREATE TABLE users (id INTEGER)');
    await expect(db.update('users', { id: 2 }, {})).rejects.toThrow(/where/);
    await expect(db.delete('users', {})).rejects.toThrow(/where/);
  });

  test('attach another duckdb file, query, detach', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'clay-duckdb-'));
    const otherPath = join(dir, 'other.duckdb');
    try {
      const setup = create();
      const other = await setup.connect('other', otherPath);
      await other.exec('CREATE TABLE items (id INTEGER, label VARCHAR)');
      await other.insert('items', { id: 7, label: 'widget' });
      await setup.close('other');

      const duck = create();
      const app = await duck.connect('app');
      await duck.attach('app', { alias: 'legacy', type: 'duckdb', path: otherPath });

      const rows = await app.query('SELECT * FROM legacy.items ORDER BY id');
      expect(rows).toEqual([{ id: 7, label: 'widget' }]);

      await app.insert('legacy.items', { id: 8, label: 'gizmo' });
      expect(await app.query('SELECT id FROM legacy.items ORDER BY id')).toEqual([
        { id: 7 },
        { id: 8 },
      ]);

      await duck.detach('app', 'legacy');
      await expect(app.query('SELECT * FROM legacy.items')).rejects.toThrow();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('close removes from registry', async () => {
    const duck = create();
    await duck.connect('x');
    expect(duck.has('x')).toBe(true);
    await duck.close('x');
    expect(duck.has('x')).toBe(false);
    expect(() => duck.db('x')).toThrow(/Unknown/);
  });

  test('connect rejects duplicate names', async () => {
    const duck = create();
    await duck.connect('app');
    await expect(duck.connect('app')).rejects.toThrow(/already exists/);
  });
});
