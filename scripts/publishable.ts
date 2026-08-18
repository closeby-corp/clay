/**
 * Shared publishable package list and helpers for pack / dry-run / publish.
 *
 * Order matters for registry publish (deps first):
 *   core → auth → compiler → persistence-file → components → server → ui → cli
 *
 * `@close-by/clay` is the app-facing `ui` facade (folder `packages/ui`).
 * Other folders publish as `@close-by/clay-<folder>`.
 * `@close-by/clay-client` stays private; Vite output ships inside `@close-by/clay-cli` as `client-dist`.
 */
import { join } from 'path';

export const root = join(import.meta.dir, '..');
export const outDir = join(root, 'dist-pack');

/** Runtime packages consumers need for `clay hello.ts` (client is bundled into cli). */
export const PACKAGES = [
  'core',
  'auth',
  'compiler',
  'persistence-file',
  'components',
  'server',
  'ui',
  'cli',
] as const;

export type PublishableName = (typeof PACKAGES)[number];

export const REPOSITORY = {
  type: 'git',
  url: 'git+https://github.com/closeby-corp/clay.git',
} as const;

/** Workspace folder → npm package name. */
export function npmName(folder: PublishableName): string {
  return folder === 'ui' ? '@close-by/clay' : `@close-by/clay-${folder}`;
}

/** npm pack filename for a scoped package (`@close-by/clay` → `close-by-clay-0.1.0.tgz`). */
export function tarballFilename(folder: PublishableName, version: string): string {
  return `${npmName(folder).slice(1).replace('/', '-')}-${version}.tgz`;
}

export function tarballPath(name: PublishableName, version: string): string {
  return join(outDir, tarballFilename(name, version));
}

export async function readCoreVersion(): Promise<string> {
  const corePkg = (await Bun.file(join(root, 'packages/core/package.json')).json()) as {
    version: string;
  };
  return corePkg.version;
}

/** True if `name@version` is already on the public npm registry. */
export async function npmHasVersion(name: string, version: string): Promise<boolean> {
  const url = `https://registry.npmjs.org/${name.replace('/', '%2f')}/${encodeURIComponent(version)}`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (res.status === 404) return false;
  if (!res.ok) {
    throw new Error(`npm registry ${res.status} for ${name}@${version}`);
  }
  return true;
}
