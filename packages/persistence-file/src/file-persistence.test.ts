import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFilePersistence } from './file-persistence';

describe('createFilePersistence', () => {
  const dirs: string[] = [];

  afterEach(async () => {
    for (const dir of dirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  async function tempDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'badui-persist-'));
    dirs.push(dir);
    return dir;
  }

  test('load returns null for missing keys', async () => {
    const dir = await tempDir();
    const persistence = createFilePersistence({ dir });

    expect(await persistence.load('missing')).toBeNull();
  });

  test('save/load round-trip', async () => {
    const dir = await tempDir();
    const persistence = createFilePersistence({ dir });
    const json = JSON.stringify({ count: 42, items: ['a', 'b'] });

    await persistence.save('counter', json);

    expect(await persistence.load('counter')).toBe(json);
    expect(await readFile(join(dir, 'counter.json'), 'utf8')).toBe(json);
  });

  test('overwrites existing key', async () => {
    const dir = await tempDir();
    const persistence = createFilePersistence({ dir });

    await persistence.save('k', '"first"');
    await persistence.save('k', '"second"');

    expect(await persistence.load('k')).toBe('"second"');
  });

  test('isolates keys and encodes unsafe filenames', async () => {
    const dir = await tempDir();
    const persistence = createFilePersistence({ dir });

    await persistence.save('a/b', '"slash"');
    await persistence.save('plain', '"ok"');

    expect(await persistence.load('a/b')).toBe('"slash"');
    expect(await persistence.load('plain')).toBe('"ok"');
    expect(await persistence.load('a')).toBeNull();

    const encoded = await readFile(
      join(dir, `${encodeURIComponent('a/b')}.json`),
      'utf8',
    );
    expect(encoded).toBe('"slash"');
  });

  test('survives a new adapter instance on the same dir', async () => {
    const dir = await tempDir();
    const first = createFilePersistence({ dir });
    await first.save('shared', JSON.stringify([1, 2, 3]));

    const second = createFilePersistence({ dir });
    expect(await second.load('shared')).toBe(JSON.stringify([1, 2, 3]));
  });
});
