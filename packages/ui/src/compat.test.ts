import { test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { computeSurface, surfacePath } from '../../../scripts/compat-surface';

test('public surface matches the compatibility record', async () => {
  const recorded: string[] = JSON.parse(await readFile(surfacePath, 'utf8'));
  const current = await computeSurface();
  const currentSet = new Set(current);
  const recordedSet = new Set(recorded);
  const removed = recorded.filter((entry) => !currentSet.has(entry));
  const added = current.filter((entry) => !recordedSet.has(entry));
  const failures: string[] = [];
  if (removed.length) {
    failures.push('Public API removed. Add the old name back as an alias marked @deprecated (see docs/compatibility.md). If the removal is intentional, run `bun scripts/compat-surface.ts --write` and list it under Breaking in the release notes.\n' + removed.join('\n'));
  }
  if (added.length) {
    failures.push('New public API is not in the compatibility record. Run `bun scripts/compat-surface.ts --write` and commit compat/surface.json.\n' + added.join('\n'));
  }
  if (failures.length) throw new Error(failures.join('\n\n'));
});
