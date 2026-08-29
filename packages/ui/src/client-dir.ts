import { existsSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Resolve Vite client assets for `ui.run({ clientDir })`.
 *
 * Preference order:
 * 1. Explicit `fromDir` (tests / advanced)
 * 2. `@close-by/clay-cli/client-dist` when the CLI package is installed
 * 3. Monorepo `packages/client/dist` (dev) relative to this module
 *
 * Prefer this over hardcoding `node_modules/@close-by/clay-cli/client-dist`.
 */
export function resolveClayClientDir(fromDir?: string): string {
  if (fromDir) {
    const shipped = join(fromDir, '../client-dist');
    if (existsSync(join(shipped, 'index.html'))) return shipped;
    return join(fromDir, '../../client/dist');
  }

  try {
    const require = createRequire(import.meta.url);
    const pkgJson = require.resolve('@close-by/clay-cli/package.json');
    const shipped = join(dirname(pkgJson), 'client-dist');
    if (existsSync(join(shipped, 'index.html'))) return shipped;
  } catch {
    // CLI not installed — fall through
  }

  // Monorepo: packages/ui/src → packages/client/dist
  return join(fileURLToPath(new URL('.', import.meta.url)), '../../client/dist');
}
