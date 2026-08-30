/**
 * Validate (and optionally publish) packed @close-by/clay* tarballs in dist-pack/.
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
import {
  npmHasVersion,
  npmName,
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
      throw new Error(`${npmName(pkg)}: dependency ${dep} still has ${range} (expected rewritten version)`);
    }
  }
}

/**
 * `bun pm pack` rewrites `workspace:*` from **bun.lock** workspace versions, not
 * live package.json. Fail if an internal @close-by/clay* dep is still an older
 * release (nested install would pull stale core).
 */
function assertInternalDepsMatchRelease(meta: PackedMeta, pkg: PublishableName, version: string) {
  const deps = meta.dependencies ?? {};
  for (const [dep, range] of Object.entries(deps)) {
    if (!dep.startsWith('@close-by/clay')) continue;
    if (range !== version) {
      throw new Error(
        `${npmName(pkg)}: dependency ${dep} is ${range}, expected ${version} ` +
          `(refresh bun.lock workspace versions after bumping package.json)`,
      );
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
    const expectedName = npmName(name);
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
    assertInternalDepsMatchRelease(meta, name, version);

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

    if (name === 'ui') {
      if (!entries.some((e) => e === 'package/SKILL.md' || e.endsWith('/SKILL.md'))) {
        errors.push('ui: package/SKILL.md missing from tarball');
      }
      for (const doc of ['getting-started.md', 'api.md', 'elements.md']) {
        if (!entries.some((e) => e === `package/docs/${doc}` || e.endsWith(`/docs/${doc}`))) {
          errors.push(`ui: package/docs/${doc} missing from tarball`);
        }
      }
    }

    console.log(`  ✓ ${npmName(name)}@${meta.version} (${tgz})`);
  } catch (e) {
    errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

if (errors.length) {
  console.error('\nValidation failed:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`\n→ npm ${doPublish ? 'publish' : 'publish --dry-run'} (each tarball, publish order)`);
const published: string[] = [];
const skipped: string[] = [];

for (const name of PACKAGES) {
  const pkg = npmName(name);
  const tgz = tarballPath(name, version);
  const label = `${pkg}@${version}`;

  console.log(`\n=== ${pkg} ${doPublish ? 'PUBLISH' : 'dry-run'} ===`);

  let already: boolean;
  try {
    already = await npmHasVersion(pkg, version);
  } catch (e) {
    console.error(`Registry check failed for ${label}: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }

  if (already) {
    console.log(`  skip — ${label} already on npm`);
    skipped.push(label);
    continue;
  }

  const npmArgs = ['publish', tgz, '--access', 'public'];
  if (!doPublish) npmArgs.push('--dry-run');

  const proc = Bun.spawn(['npm', ...npmArgs], {
    cwd: root,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const code = await proc.exited;
  if (code !== 0) {
    console.error(`npm publish failed for ${pkg} (exit ${code})`);
    if (doPublish) {
      console.error(
        'Partial release is OK to resume: re-run `bun run publish:npm` (already-published versions are skipped).',
      );
      console.error('To reuse tarballs: bun scripts/publish-from-pack.ts --publish --skip-pack');
    }
    process.exit(code);
  }
  published.push(label);
}

if (skipped.length) {
  console.log(`\nSkipped (already on npm): ${skipped.join(', ')}`);
}

if (doPublish) {
  if (published.length) {
    console.log(`Published: ${published.join(', ')}`);
  } else {
    console.log(`Nothing new to publish — all ${PACKAGES.length} packages already on npm at ${version}.`);
  }
  console.log('Consumers: bun add @close-by/clay-cli @close-by/clay && bunx clay hello.ts');
} else {
  console.log(`
Dry-run OK — packs are publish-ready (no registry upload).

Live publish (requires npm login / OTP for the @close-by org):
  npm login
  bun run publish:npm

Or: bun scripts/publish-from-pack.ts --publish
`);
}
