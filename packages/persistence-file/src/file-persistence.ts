import type { PersistenceAdapter } from '@close-by/clay-core';
import { open, mkdir, readFile, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

export type FilePersistenceOptions = {
  /** Directory for per-key JSON files (created if missing). */
  dir: string;
};

function keyToFilename(key: string): string {
  return `${encodeURIComponent(key)}.json`;
}

export async function writeFileAtomically(
  path: string,
  contents: string,
  commit: (from: string, to: string) => Promise<void> = rename,
): Promise<void> {
  const temporaryPath = `${path}.tmp-${randomUUID()}`;
  let file: Awaited<ReturnType<typeof open>> | undefined;
  try {
    file = await open(temporaryPath, 'wx');
    await file.writeFile(contents, 'utf8');
    await file.close();
    file = undefined;
    await commit(temporaryPath, path);
  } catch (error) {
    await file?.close().catch(() => {});
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
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
      await writeFileAtomically(pathFor(key), json);
    },
  };
}
