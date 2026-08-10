/**
 * Validate (and optionally publish) packed @clay tarballs in dist-pack/.
 *
 * Default: pack + dry-run validation (`bun run publish:dry`).
 * Live publish: `bun run publish:npm` (requires npm auth; uploads to the registry).
 *
 * Usage:
 *   bun scripts/publish-from-pack.ts --dry-run
 *   bun scripts/publish-from-pack.ts --publish
 *   bun scripts/publish-from-pack.ts --dry-run --skip-pack   # reuse existing dist-pack/
 */
import { existsSync } from 'fs';
import { join } from 'path';
import {
  outDir,
  PACKAGES,
  readCoreVersion,
  root,
  tarballPath,
  type PublishableName,
} from './publishable.ts';

const args = new Set(process.argv.slice(2));
const doPublish = args.has('--publish');
const skipPack = args.has('--skip-pack');

if (args.has('--dry-run') && doPublish) {
  console.error('Pass either --dry-run or --publish, not both.');
  process.exit(1);
}

const version = await readCoreVersion();

if (!skipPack) {
  console.log('→ bun run pack:publishable');
  const pack = Bun.spawn(['bun', 'run', 'pack:publishable'], {
    cwd: root,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  if ((await pack.exited) !== 0) process.exit(1);
} else if (!existsSync(outDir)) {
  console.error(`Missing ${outDir}. Run bun run pack:publishable first (or omit --skip-pack).`);
  process.exit(1);
}

type PackedMeta = {
  name: string;
  version: string;
  license?: string;
  bin?: Record<string, string>;
  files?: string[];
  dependencies?: Record<string, string>;
  publishConfig?: { access?: string };
};

async function readPackedJson(tgz: string): Promise<PackedMeta> {
  const proc = Bun.spawn(['tar', '-xOf', tgz, 'package/package.json'], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const out = await new Response(proc.stdout).text();
  if ((await proc.exited) !== 0) {
    throw new Error(`Failed to read package.json from ${tgz}`);
  }
  return JSON.parse(out) as PackedMeta;
}

async function listTarball(tgz: string): Promise<string[]> {
  const proc = Bun.spawn(['tar', '-tzf', tgz], { stdout: 'pipe', stderr: 'pipe' });
  const out = await new Response(proc.stdout).text();
  if ((await proc.exited) !== 0) {
    throw new Error(`Failed to list ${tgz}`);
  }
  return out.split('\n').filter(Boolean);
}

function assertNoWorkspaceDeps(meta: PackedMeta, pkg: PublishableName) {
  const deps = meta.dependencies ?? {};
  for (const [dep, range] of Object.entries(deps)) {
    if (range.startsWith('workspace:')) {
      throw new Error(`@clay/${pkg}: dependency ${dep} still has ${range} (expected rewritten version)`);
    }
  }
}

console.log(`\n→ validating ${PACKAGES.length} tarballs (v${version})`);
const errors: string[] = [];

for (const name of PACKAGES) {
  const tgz = tarballPath(name, version);
  if (!existsSync(tgz)) {
    errors.push(`missing tarball: ${tgz}`);
    continue;
  }

  try {
    const meta = await readPackedJson(tgz);
    const expectedName = `@clay/${name}`;
    if (meta.name !== expectedName) {
      errors.push(`${name}: name is ${meta.name}, expected ${expectedName}`);
    }
    if (meta.version !== version) {
      errors.push(`${name}: version is ${meta.version}, expected ${version}`);
    }
    if (!meta.license) {
      errors.push(`${name}: missing license field`);
    }
    if (meta.publishConfig?.access !== 'public') {
      errors.push(`${name}: publishConfig.access should be "public" (scoped package)`);
    }
    assertNoWorkspaceDeps(meta, name);

    const entries = await listTarball(tgz);
    if (!entries.some((e) => e === 'package/LICENSE' || e.endsWith('/LICENSE'))) {
      errors.push(`${name}: LICENSE not in tarball`);
    }
    if (!entries.some((e) => e === 'package/README.md' || e.endsWith('/README.md'))) {
      errors.push(`${name}: README.md not in tarball`);
    }

    if (name === 'cli') {
      if (!meta.bin?.clay) {
        errors.push('cli: missing bin.clay');
      }
      if (!entries.some((e) => e.includes('client-dist/'))) {
        errors.push('cli: client-dist/ missing from tarball');
      }
      if (!entries.includes('package/bin/clay')) {
        errors.push('cli: package/bin/clay missing from tarball');
      }
    }

    console.log(`  ✓ @clay/${name}@${meta.version} (${tgz})`);
  } catch (e) {
    errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

if (errors.length) {
  console.error('\nValidation failed:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('\n→ npm publish --dry-run (each tarball, publish order)');
for (const name of PACKAGES) {
  const tgz = tarballPath(name, version);
  const npmArgs = ['publish', tgz, '--access', 'public'];
  if (!doPublish) npmArgs.push('--dry-run');

  console.log(`\n=== @clay/${name} ${doPublish ? 'PUBLISH' : 'dry-run'} ===`);
  const proc = Bun.spawn(['npm', ...npmArgs], {
    cwd: root,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const code = await proc.exited;
  if (code !== 0) {
    console.error(`npm publish failed for @clay/${name} (exit ${code})`);
    if (doPublish) {
      console.error(
        'Stop here to avoid a partial release. Fix auth/registry, then re-run from this package onward.',
      );
    }
    process.exit(code);
  }
}

if (doPublish) {
  console.log(`\nPublished @clay/{${PACKAGES.join(',')}}@${version}`);
  console.log('Consumers: bun add @clay/cli @clay/ui && bunx clay hello.ts');
} else {
  console.log(`
Dry-run OK — packs are publish-ready (no registry upload).

Live publish (requires npm login / OTP for the @clay scope):
  npm login
  bun run publish:npm

Or: bun scripts/publish-from-pack.ts --publish
`);
}
