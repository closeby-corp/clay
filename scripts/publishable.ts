/**
 * Shared publishable package list and helpers for pack / dry-run / publish.
 *
 * Order matters for registry publish (deps first):
 *   core → auth → compiler → persistence-file → components → server → ui → cli
 *
 * `@clay/client` stays private; Vite output ships inside `@clay/cli` as `client-dist`.
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

export function tarballPath(name: PublishableName, version: string): string {
  return join(outDir, `clay-${name}-${version}.tgz`);
}

export async function readCoreVersion(): Promise<string> {
  const corePkg = (await Bun.file(join(root, 'packages/core/package.json')).json()) as {
    version: string;
  };
  return corePkg.version;
}
