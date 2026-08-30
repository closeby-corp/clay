import { describe, expect, test, afterEach } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'bun';

describe('ClayServer spa shell', () => {
  let server: Server | null = null;
  let dir: string;

  afterEach(async () => {
    server?.stop(true);
    server = null;
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  test('injects __CLAY_DEV__ when dev is true', async () => {
    const { ClayServer } = await import('./server');
    const { clearPages, page } = await import('@close-by/clay-core');
    clearPages();
    page('/', () => {});

    dir = await mkdtemp(join(tmpdir(), 'clay-spa-'));
    await writeFile(join(dir, 'index.js'), '');
    const clay = new ClayServer({
      port: 0,
      clientDir: dir,
      userStorageDir: false,
      dev: true,
    });
    server = clay.start();
    const html = await (await fetch(`http://127.0.0.1:${clay.port}/`)).text();
    expect(html).toContain('window.__CLAY_DEV__=true');
    clay.stop();
    server = null;
  });

  test('omits __CLAY_DEV__ when dev is false', async () => {
    const { ClayServer } = await import('./server');
    const { clearPages, page } = await import('@close-by/clay-core');
    clearPages();
    page('/', () => {});

    dir = await mkdtemp(join(tmpdir(), 'clay-spa-'));
    await writeFile(join(dir, 'index.js'), '');
    const clay = new ClayServer({
      port: 0,
      clientDir: dir,
      userStorageDir: false,
      dev: false,
    });
    server = clay.start();
    const html = await (await fetch(`http://127.0.0.1:${clay.port}/`)).text();
    expect(html).not.toContain('__CLAY_DEV__');
    clay.stop();
    server = null;
  });
});
