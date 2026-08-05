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

const root = join(import.meta.dir, '..');
const outDir = join(root, 'dist-pack');

/** Runtime packages consumers need for `badui hello.ts` (client is bundled into cli). */
const PACKAGES = [
  'core',
  'persistence-file',
  'components',
  'server',
  'ui',
  'cli',
] as const;

const corePkg = (await Bun.file(join(root, 'packages/core/package.json')).json()) as {
  version: string;
};
const version = corePkg.version;

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
  // Expected tarball name from bun pm pack (scoped @badui/foo → badui-foo-VERSION.tgz)
  const expected = join(outDir, `badui-${name}-${version}.tgz`);
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

Then:
  bunx badui hello.ts

Once published to the registry (same versions):
  bun add @badui/cli @badui/ui
  bunx badui hello.ts
`);
