import { describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { resolveBundledClientDir } from './helpers.ts';

const tmpRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../.tmp-client-resolve');

describe('resolveBundledClientDir', () => {
  test('prefers shipped client-dist when index.html exists', () => {
    const srcDir = join(tmpRoot, 'src');
    const shipped = join(tmpRoot, 'client-dist');
    rmSync(tmpRoot, { recursive: true, force: true });
    mkdirSync(shipped, { recursive: true });
    writeFileSync(join(shipped, 'index.html'), '<html></html>');

    expect(resolveBundledClientDir(srcDir)).toBe(shipped);
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  test('falls back to monorepo packages/client/dist', () => {
    const srcDir = join(tmpRoot, 'src');
    rmSync(tmpRoot, { recursive: true, force: true });
    mkdirSync(srcDir, { recursive: true });

    const resolved = resolveBundledClientDir(srcDir);
    expect(resolved).toBe(join(srcDir, '../../client/dist'));
    rmSync(tmpRoot, { recursive: true, force: true });
  });
});
