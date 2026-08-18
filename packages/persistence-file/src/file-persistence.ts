import type { PersistenceAdapter } from '@close-by/clay-core';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type FilePersistenceOptions = {
  /** Directory for per-key JSON files (created if missing). */
  dir: string;
};

function keyToFilename(key: string): string {
  return `${encodeURIComponent(key)}.json`;
}

/**
 * File-backed PersistenceAdapter: one JSON text file per key.
 *
 * @example
 * ```ts
 * import { storage } from '@close-by/clay-core';
 * import { createFilePersistence } from '@close-by/clay-persistence-file';
 *
 * storage.configure({
 *   app: createFilePersistence({ dir: '.clay-data' }),
 *   user: createFilePersistence({ dir: '.clay-user-data' }),
 * });
 * ```
 */
export function createFilePersistence(
  options: FilePersistenceOptions,
): PersistenceAdapter {
  const { dir } = options;
  let ready: Promise<void> | null = null;

  async function ensureDir(): Promise<void> {
    if (!ready) {
      ready = mkdir(dir, { recursive: true }).then(() => undefined);
    }
    await ready;
  }

  function pathFor(key: string): string {
    return join(dir, keyToFilename(key));
  }

  return {
    async load(key: string): Promise<string | null> {
      await ensureDir();
      try {
        return await readFile(pathFor(key), 'utf8');
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw err;
      }
    },

    async save(key: string, json: string): Promise<void> {
      await ensureDir();
      await writeFile(pathFor(key), json, 'utf8');
    },
  };
}
