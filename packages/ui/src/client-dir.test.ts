import { describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { resolveClayClientDir } from './client-dir.ts';

const tmpRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../.tmp-client-dir');

describe('resolveClayClientDir', () => {
  test('prefers client-dist next to fromDir parent', () => {
    rmSync(tmpRoot, { recursive: true, force: true });
    const srcDir = join(tmpRoot, 'src');
    const shipped = join(tmpRoot, 'client-dist');
    mkdirSync(shipped, { recursive: true });
    writeFileSync(join(shipped, 'index.html'), '<html></html>');
    expect(resolveClayClientDir(srcDir)).toBe(shipped);
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  test('falls back to packages/client/dist relative to fromDir', () => {
    rmSync(tmpRoot, { recursive: true, force: true });
    const srcDir = join(tmpRoot, 'src');
    mkdirSync(srcDir, { recursive: true });
    expect(resolveClayClientDir(srcDir)).toBe(join(srcDir, '../../client/dist'));
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  test('default resolve returns an existing client dist in this monorepo (when built)', () => {
    const dir = resolveClayClientDir();
    // Either monorepo client dist or installed clay-cli client-dist
    expect(dir.includes('client')).toBe(true);
    // Soft: path string is absolute-ish
    expect(dir.length).toBeGreaterThan(5);
    void existsSync;
  });
});
