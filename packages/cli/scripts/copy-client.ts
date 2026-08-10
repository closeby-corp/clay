/**
 * Copy packages/client/dist → packages/cli/client-dist so @clay/cli can
 * publish/ship the Vite client assets with the package.
 *
 * Usage: bun run --cwd packages/cli copy-client
 * (also run from root build:client and CLI prepack)
 */
import { access, cp, mkdir, rm } from 'fs/promises';
import { join } from 'path';

const cliRoot = join(import.meta.dir, '..');
const src = join(cliRoot, '../client/dist');
const dest = join(cliRoot, 'client-dist');

try {
  await access(join(src, 'index.html'));
} catch {
  console.error(
    `Missing client build at ${src}\nRun: bun run build:client (from repo root)`,
  );
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });
console.log(`Copied client assets → ${dest}`);
