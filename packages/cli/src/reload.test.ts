import { describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import {
  buildReloadChildCommand,
  buildReloadStubSource,
  filterReloadArgv,
  reloadStubFileName,
  resolveEntryPath,
  resolveWatchRoot,
} from './reload.ts';

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
});
