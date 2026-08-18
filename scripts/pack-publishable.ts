/**
 * Build client assets and pack publishable @close-by/clay* packages into dist-pack/.
 *
 * - `bun pm pack` rewrites `workspace:*` → the package version in the tarball
 * - `@close-by/clay-client` stays private; Vite output ships inside `@close-by/clay-cli` as `client-dist`
 *   (via root `build:client` → `packages/cli` `copy-client` / `prepack`)
 *
 * Usage (repo root): `bun run pack:publishable`
 */
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import {
  npmName,
  outDir,
  PACKAGES,
  readCoreVersion,
  root,
  tarballFilename,
  tarballPath,
} from './publishable.ts';

const version = await readCoreVersion();

console.log('→ bun run build:client');
const build = Bun.spawn(['bun', 'run', 'build:client'], {
  cwd: root,
  stdout: 'inherit',
  stderr: 'inherit',
});
if ((await build.exited) !== 0) process.exit(1);

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const tarballs: string[] = [];
for (const name of PACKAGES) {
  console.log(`→ packing ${npmName(name)}`);
  const expected = tarballPath(name, version);
  const proc = Bun.spawn(
    ['bun', 'pm', 'pack', '--destination', outDir, '--quiet'],
    {
      cwd: join(root, 'packages', name),
      stdout: 'inherit',
      stderr: 'inherit',
    },
  );
  if ((await proc.exited) !== 0) {
    console.error(`Failed to pack ${npmName(name)}`);
    process.exit(1);
  }
  tarballs.push(expected);
}

console.log(`\nPacked ${tarballs.length} tarballs → ${outDir}`);
for (const t of tarballs) console.log(`  ${t}`);

const npmFiles = PACKAGES.map((p) => `./dist-pack/${tarballFilename(p, version)}`).join(
  ' \\\n    ',
);

console.log(`
Install outside the monorepo (npm links co-installed file: tarballs):
  npm install ${npmFiles}

Validate publish (no registry upload):
  bun run publish:dry

Publish to npm (requires npm login; order is baked into publish:npm):
  bun run publish:npm

Or manually, in order:
  ${PACKAGES.map((p) => `npm publish ./dist-pack/${tarballFilename(p, version)} --access public`).join('\n  ')}

Once published (same versions):
  bun add @close-by/clay-cli @close-by/clay
  bunx clay hello.ts
`);
