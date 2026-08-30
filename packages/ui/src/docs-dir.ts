import { access } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Resolve shipped markdown docs for the installed Clay version.
 *
 * 1. `packages/ui/docs` when developing in the monorepo (after sync-docs)
 * 2. `@close-by/clay/docs` when installed from npm
 */
export async function resolveClayDocsDir(fromDir?: string): Promise<string> {
  const base = fromDir ?? dirname(fileURLToPath(import.meta.url));
  const local = join(base, '../docs');
  if (await hasDocIndex(local)) return local;

  try {
    const pkgJson = require.resolve('@close-by/clay/package.json');
    const shipped = join(dirname(pkgJson), 'docs');
    if (await hasDocIndex(shipped)) return shipped;
  } catch {
    // not installed as dependency
  }

  throw new Error(
    'Clay docs not found. Install @close-by/clay from npm or run bun scripts/sync-docs.ts in the monorepo.',
  );
}

export function resolveClayDocPath(docsDir: string, name: string): string {
  const file = name.endsWith('.md') ? name : `${name}.md`;
  return join(docsDir, file);
}

async function hasDocIndex(dir: string): Promise<boolean> {
  try {
    await access(join(dir, 'getting-started.md'));
    return true;
  } catch {
    return false;
  }
}
