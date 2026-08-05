import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Resolve the Vite client assets directory for the CLI runtime.
 *
 * Preference order:
 * 1. `packages/cli/client-dist` — shipped with the published package (copy via `bun run copy-client`)
 * 2. `packages/client/dist` — monorepo workspace fallback after `bun run build:client`
 */
export function resolveBundledClientDir(fromDir = import.meta.dir): string {
  const shipped = join(fromDir, '../client-dist');
  if (existsSync(join(shipped, 'index.html'))) {
    return shipped;
  }
  return join(fromDir, '../../client/dist');
}

/** Open a URL in the default browser (best-effort). */
export function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd =
    platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    Bun.spawn([cmd, ...args], {
      stdout: 'ignore',
      stderr: 'ignore',
      stdin: 'ignore',
    });
  } catch {
    console.warn(`Could not open browser for ${url}`);
  }
}

/** Resolve title from CLI flag, nearest package.json name, or default. */
export async function resolveTitle(explicit: string | undefined, cwd: string): Promise<string> {
  if (explicit) return explicit;
  try {
    const pkgPath = join(cwd, 'package.json');
    const file = Bun.file(pkgPath);
    if (await file.exists()) {
      const pkg = (await file.json()) as { name?: string };
      if (pkg.name && pkg.name !== 'badui') return pkg.name;
    }
  } catch {
    // ignore
  }
  return 'BadUI';
}
