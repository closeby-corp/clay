/**
 * Copy repo docs/ → packages/ui/docs for @close-by/clay npm publish.
 *
 * Usage (repo root): bun scripts/sync-docs.ts
 * Also runs from packages/ui prepack before bun pm pack.
 */
import { cp, mkdir, readdir, rm, access } from 'fs/promises';
import { join } from 'path';

const root = join(import.meta.dir, '..');
const srcDir = join(root, 'docs');
const destDir = join(root, 'packages/ui/docs');

/** Markdown shipped with @close-by/clay (must exist after sync). */
export const REQUIRED_DOC_FILES = [
  'README.md',
  'getting-started.md',
  'api.md',
  'elements.md',
  'reactive-let.md',
] as const;

export async function syncDocs(): Promise<string[]> {
  const copied: string[] = [];

  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });

  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isFile() || !ent.name.endsWith('.md')) continue;
    await cp(join(srcDir, ent.name), join(destDir, ent.name));
    copied.push(ent.name);
  }

  copied.sort();

  for (const name of REQUIRED_DOC_FILES) {
    if (!copied.includes(name)) {
      throw new Error(`Missing required doc after sync: docs/${name}`);
    }
  }

  const llmsSrc = join(root, 'llms.txt');
  try {
    await access(llmsSrc);
    await cp(llmsSrc, join(destDir, 'llms.txt'));
    copied.push('llms.txt');
  } catch {
    // optional
  }

  return copied;
}

if (import.meta.main) {
  const files = await syncDocs();
  console.log(`Synced ${files.length} files → ${destDir}`);
}
