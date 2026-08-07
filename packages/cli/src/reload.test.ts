import { describe, expect, test, afterEach } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import {
  buildReloadChildCommand,
  buildReloadStubSource,
  filterReloadArgv,
  reloadOpenMarkerFileName,
  reloadStubFileName,
  resolveEntryPath,
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

  test('reload stub is skipped by page discovery naming', () => {
    expect(reloadStubFileName(42)).toBe('_badui-reload-42.ts');
    expect(reloadStubFileName(42).startsWith('_')).toBe(true);
    expect(reloadOpenMarkerFileName(42)).toBe('_badui-reload-opened-42');
  });

  test('buildReloadChildCommand watches the stub, not the CLI module', () => {
    const cmd = buildReloadChildCommand('/usr/bin/bun', '/proj/_badui-reload-1.ts');
    expect(cmd).toEqual(['/usr/bin/bun', '--watch', '/proj/_badui-reload-1.ts']);
    expect(cmd.join(' ')).not.toContain('/packages/cli/');
  });

  test('buildReloadStubSource imports CLI main with filtered argv', () => {
    const src = buildReloadStubSource('/repo/packages/cli/src/main.ts', [
      '/proj/hello.ts',
      '-p',
      '4000',
    ]);
    expect(src).toContain('BADUI_RELOAD_CHILD');
    expect(src).toContain('await import(');
    expect(src).toContain('/repo/packages/cli/src/main.ts');
    expect(src).toContain('/proj/hello.ts');
    expect(src).toContain('4000');
    expect(src).not.toContain('--reload');
  });

  test('stub write lands next to entry watch root', async () => {
    rmSync(tmpRoot, { recursive: true, force: true });
    const pages = join(tmpRoot, 'pages');
    mkdirSync(pages, { recursive: true });
    writeFileSync(join(pages, 'home.ts'), 'export {}');

    const stubPath = join(resolveWatchRoot(pages, true), reloadStubFileName(7));
    await Bun.write(
      stubPath,
      buildReloadStubSource('/cli/main.ts', [pages, '--no-open']),
    );
    expect(existsSync(stubPath)).toBe(true);
    expect(stubPath.startsWith(pages)).toBe(true);

    rmSync(tmpRoot, { recursive: true, force: true });
  });

  test('writeReloadStubNudge changes stub contents (Bun watches content, not utimes)', () => {
    rmSync(tmpRoot, { recursive: true, force: true });
    mkdirSync(tmpRoot, { recursive: true });
    const stubPath = join(tmpRoot, '_badui-reload-nudge.ts');
    const base = buildReloadStubSource('/cli/main.ts', ['/pages']);
    writeReloadStubNudge(stubPath, base, 1);
    const first = readFileSync(stubPath, 'utf8');
    writeReloadStubNudge(stubPath, base, 2);
    const second = readFileSync(stubPath, 'utf8');
    expect(first).toContain('badui-reload-nudge 1');
    expect(second).toContain('badui-reload-nudge 2');
    expect(first).not.toEqual(second);
    rmSync(tmpRoot, { recursive: true, force: true });
  });
});

describe('shouldOpenBrowser', () => {
  const prevChild = process.env.BADUI_RELOAD_CHILD;
  const prevMarker = process.env.BADUI_RELOAD_OPEN_MARKER;

  afterEach(() => {
    if (prevChild === undefined) delete process.env.BADUI_RELOAD_CHILD;
    else process.env.BADUI_RELOAD_CHILD = prevChild;
    if (prevMarker === undefined) delete process.env.BADUI_RELOAD_OPEN_MARKER;
    else process.env.BADUI_RELOAD_OPEN_MARKER = prevMarker;
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  test('respects --no-open', () => {
    delete process.env.BADUI_RELOAD_CHILD;
    expect(shouldOpenBrowser(false)).toBe(false);
  });

  test('opens on normal (non-reload) runs', () => {
    delete process.env.BADUI_RELOAD_CHILD;
    delete process.env.BADUI_RELOAD_OPEN_MARKER;
    expect(shouldOpenBrowser(true)).toBe(true);
  });

  test('opens once under reload child, then skips', () => {
    mkdirSync(tmpRoot, { recursive: true });
    const marker = join(tmpRoot, 'opened');
    process.env.BADUI_RELOAD_CHILD = '1';
    process.env.BADUI_RELOAD_OPEN_MARKER = marker;
    expect(shouldOpenBrowser(true)).toBe(true);
    expect(existsSync(marker)).toBe(true);
    expect(shouldOpenBrowser(true)).toBe(false);
  });
});
