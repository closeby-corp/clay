import { describe, expect, test, afterEach } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import {
  buildReloadChildCommand,
  buildReloadStubSource,
  ensureReloadDir,
  filterReloadArgv,
  reloadOpenMarkerFileName,
  reloadStubFileName,
  resolveEntryPath,
  resolveReloadDir,
  resolveWatchRoot,
  writeReloadStubNudge,
} from './reload.ts';
import { shouldOpenBrowser } from './main.ts';

const tmpRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../.tmp-reload');

describe('reload helpers', () => {
  test('filterReloadArgv strips --reload only', () => {
    expect(filterReloadArgv(['app.ts', '--reload', '-p', '3000'])).toEqual([
      'app.ts',
      '-p',
      '3000',
    ]);
  });

  test('resolveEntryPath joins cwd for relative entries', () => {
    expect(resolveEntryPath('hello.ts', '/proj')).toBe(join('/proj', 'hello.ts'));
    expect(resolveEntryPath('/abs/app.ts', '/proj')).toBe('/abs/app.ts');
  });

  test('resolveWatchRoot uses file parent or the directory itself', () => {
    expect(resolveWatchRoot('/proj/app.ts', false)).toBe('/proj');
    expect(resolveWatchRoot('/proj/pages', true)).toBe('/proj/pages');
  });

  test('reload stubs live under .clay-reload, not pages/', () => {
    expect(resolveReloadDir('/proj')).toBe(join('/proj', '.clay-reload'));
    expect(reloadStubFileName(42)).toBe('_clay-reload-42.ts');
    expect(reloadOpenMarkerFileName(42)).toBe('_clay-reload-opened-42');
  });

  test('buildReloadChildCommand watches the stub, not the CLI module', () => {
    const cmd = buildReloadChildCommand('/usr/bin/bun', '/proj/.clay-reload/_clay-reload-1.ts');
    expect(cmd).toEqual(['/usr/bin/bun', '--watch', '/proj/.clay-reload/_clay-reload-1.ts']);
    expect(cmd.join(' ')).not.toContain('/packages/cli/');
  });

  test('buildReloadStubSource imports CLI main with filtered argv', () => {
    const src = buildReloadStubSource('/repo/packages/cli/src/main.ts', [
      '/proj/hello.ts',
      '-p',
      '4000',
    ]);
    expect(src).toContain('CLAY_RELOAD_CHILD');
    expect(src).toContain('await import(');
    expect(src).toContain('/repo/packages/cli/src/main.ts');
    expect(src).toContain('/proj/hello.ts');
    expect(src).toContain('4000');
    expect(src).not.toContain('--reload');
  });

  test('ensureReloadDir creates .clay-reload outside pages', () => {
    rmSync(tmpRoot, { recursive: true, force: true });
    mkdirSync(join(tmpRoot, 'pages'), { recursive: true });
    writeFileSync(join(tmpRoot, 'pages', 'home.ts'), 'export {}');

    const dir = ensureReloadDir(tmpRoot);
    expect(dir).toBe(join(tmpRoot, '.clay-reload'));
    expect(existsSync(dir)).toBe(true);

    const stubPath = join(dir, reloadStubFileName(7));
    writeFileSync(stubPath, buildReloadStubSource('/cli/main.ts', [join(tmpRoot, 'pages'), '--no-open']));
    expect(existsSync(stubPath)).toBe(true);
    expect(stubPath.includes(`${join('pages')}${join('/', '')}`)).toBe(false);
    expect(stubPath).not.toContain('/pages/');

    rmSync(tmpRoot, { recursive: true, force: true });
  });

  test('writeReloadStubNudge changes stub contents (Bun watches content, not utimes)', () => {
    rmSync(tmpRoot, { recursive: true, force: true });
    mkdirSync(tmpRoot, { recursive: true });
    const stubPath = join(tmpRoot, '_clay-reload-nudge.ts');
    const base = buildReloadStubSource('/cli/main.ts', ['/pages']);
    writeReloadStubNudge(stubPath, base, 1);
    const first = readFileSync(stubPath, 'utf8');
    writeReloadStubNudge(stubPath, base, 2);
    const second = readFileSync(stubPath, 'utf8');
    expect(first).toContain('clay-reload-nudge 1');
    expect(second).toContain('clay-reload-nudge 2');
    expect(first).not.toEqual(second);
    rmSync(tmpRoot, { recursive: true, force: true });
  });
});

describe('shouldOpenBrowser', () => {
  const prevChild = process.env.CLAY_RELOAD_CHILD;
  const prevMarker = process.env.CLAY_RELOAD_OPEN_MARKER;

  afterEach(() => {
    if (prevChild === undefined) delete process.env.CLAY_RELOAD_CHILD;
    else process.env.CLAY_RELOAD_CHILD = prevChild;
    if (prevMarker === undefined) delete process.env.CLAY_RELOAD_OPEN_MARKER;
    else process.env.CLAY_RELOAD_OPEN_MARKER = prevMarker;
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  test('respects --no-open', () => {
    delete process.env.CLAY_RELOAD_CHILD;
    expect(shouldOpenBrowser(false)).toBe(false);
  });

  test('opens on normal (non-reload) runs', () => {
    delete process.env.CLAY_RELOAD_CHILD;
    delete process.env.CLAY_RELOAD_OPEN_MARKER;
    expect(shouldOpenBrowser(true)).toBe(true);
  });

  test('opens once under reload child, then skips', () => {
    mkdirSync(tmpRoot, { recursive: true });
    const marker = join(tmpRoot, 'opened');
    process.env.CLAY_RELOAD_CHILD = '1';
    process.env.CLAY_RELOAD_OPEN_MARKER = marker;
    expect(shouldOpenBrowser(true)).toBe(true);
    expect(existsSync(marker)).toBe(true);
    expect(shouldOpenBrowser(true)).toBe(false);
  });
});
