/**
 * Build client assets and pack publishable @badui packages into dist-pack/.
 *
 * - `bun pm pack` rewrites `workspace:*` → the package version in the tarball
 * - `@badui/client` stays private; Vite output ships inside `@badui/cli` as `client-dist`
 *   (via root `build:client` → `packages/cli` `copy-client` / `prepack`)
 *
 * Usage (repo root): `bun run pack:publishable`
 */
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import {
  outDir,
  PACKAGES,
  readCoreVersion,
  root,
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
  console.log(`→ packing @badui/${name}`);
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
    console.error(`Failed to pack @badui/${name}`);
    process.exit(1);
  }
  tarballs.push(expected);
}

console.log(`\nPacked ${tarballs.length} tarballs → ${outDir}`);
for (const t of tarballs) console.log(`  ${t}`);

const npmFiles = PACKAGES.map((p) => `./dist-pack/badui-${p}-${version}.tgz`).join(
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
  npm publish ./dist-pack/badui-core-${version}.tgz --access public
  npm publish ./dist-pack/badui-persistence-file-${version}.tgz --access public
  npm publish ./dist-pack/badui-components-${version}.tgz --access public
  npm publish ./dist-pack/badui-server-${version}.tgz --access public
  npm publish ./dist-pack/badui-ui-${version}.tgz --access public
  npm publish ./dist-pack/badui-cli-${version}.tgz --access public

Once published (same versions):
  bun add @badui/cli @badui/ui
  bunx badui hello.ts
`);
