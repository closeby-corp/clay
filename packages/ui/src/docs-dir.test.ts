import { describe, expect, test } from 'bun:test';
import { access } from 'fs/promises';
import { join } from 'path';
import { resolveClayDocPath, resolveClayDocsDir } from './docs-dir.ts';

describe('resolveClayDocsDir', () => {
  test('finds monorepo docs after sync-docs', async () => {
    const dir = await resolveClayDocsDir(join(import.meta.dir));
    await access(join(dir, 'getting-started.md'));
    expect(resolveClayDocPath(dir, 'api')).toMatch(/api\.md$/);
  });
});
