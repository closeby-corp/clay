import { describe, expect, test } from 'bun:test';
import { access } from 'fs/promises';
import { join } from 'path';
import { REQUIRED_DOC_FILES, syncDocs } from './sync-docs.ts';

describe('syncDocs', () => {
  test('copies markdown docs into packages/ui/docs', async () => {
    const copied = await syncDocs();
    expect(copied.length).toBeGreaterThanOrEqual(REQUIRED_DOC_FILES.length);
    for (const name of REQUIRED_DOC_FILES) {
      expect(copied).toContain(name);
      await access(join(import.meta.dir, '../packages/ui/docs', name));
    }
  });
});
