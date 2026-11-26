import { afterEach, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { clearPages, page } from '@close-by/clay-core';
import { ClayServer } from './server';

const builtDir = ['../../cli/client-dist', '../../client/dist']
  .map((dir) => join(import.meta.dir, dir))
  .find((dir) => existsSync(join(dir, 'index.js')) && existsSync(join(dir, 'chunks')) && statSync(join(dir, 'chunks')).isDirectory());

let clay: ClayServer | undefined;
afterEach(() => {
  clay?.stop();
  clay = undefined;
  clearPages();
});

test.skipIf(!builtDir)('built chunks, HTML and worker share one entry module URL', async () => {
  clearPages();
  page('/', () => {});
  clay = new ClayServer({ port: 0, clientDir: builtDir!, userStorageDir: false, pwa: true });
  clay.start();
  const origin = `http://127.0.0.1:${clay.port}`;
  const html = await (await fetch(origin + '/')).text();
  const entries = [...html.matchAll(/<script type="module" src="([^"]+)"/g)]
    .map((match) => new URL(match[1]!, origin + '/').href);
  expect(entries).toHaveLength(1);
  const entry = entries[0]!;
  let entryImports = 0;
  for (const chunk of readdirSync(join(builtDir!, 'chunks')).filter((file) => file.endsWith('.js'))) {
    const source = readFileSync(join(builtDir!, 'chunks', chunk), 'utf8');
    for (const match of source.matchAll(/\b(?:from\s*|import\s*\(\s*|import\s*)["']([^"']+)["']/g)) {
      const resolved = new URL(match[1]!, origin + '/assets/chunks/' + chunk);
      if (resolved.pathname === '/assets/index.js') {
        entryImports++;
        expect(resolved.href).toBe(entry);
      }
    }
  }
  expect(entryImports).toBeGreaterThan(0);
  expect((await fetch(entry)).status).toBe(200);
  const worker = await (await fetch(origin + '/sw.js')).text();
  const precache = JSON.parse(worker.match(/const PRECACHE = (\[[^\n]+\]);/)![1]!) as string[];
  const workerEntries = precache.map((url) => new URL(url, origin + '/'))
    .filter((url) => url.pathname === '/assets/index.js');
  expect(workerEntries.map((url) => url.href)).toEqual([entry]);
});
