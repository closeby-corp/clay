import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { clearPages, getRegisteredPaths, setPageWrapper } from '@close-by/clay-core';
import { ui, resetRunState, wasRunCalled } from '@close-by/clay';
import { applyDirRunConfig } from './main.ts';

const fixtures = join(fileURLToPath(new URL('.', import.meta.url)), '../fixtures');
const pagesFixture = join(fixtures, 'pages');
const pagesWithRunFixture = join(fixtures, 'pages-with-run');

beforeEach(() => {
  clearPages();
  setPageWrapper(null);
  resetRunState();
});

afterEach(() => {
  clearPages();
  setPageWrapper(null);
  resetRunState();
});

describe('clay CLI entry shapes', () => {
  test('default-export file can be registered as /', async () => {
    const mod = (await import(pathToFileURL(join(fixtures, 'default-export.ts')).href)) as {
      default?: () => void;
    };
    expect(typeof mod.default).toBe('function');
    ui.page('/', mod.default!);
    const server = ui.run({ port: 0 });
    try {
      expect(getRegisteredPaths()).toContain('/');
      expect(wasRunCalled()).toBe(true);
      expect(server.port).toBeGreaterThan(0);
    } finally {
      server.stop();
    }
  });

  test('directory loadPages + app shell config', async () => {
    await ui.loadPages(pagesFixture);
    expect(getRegisteredPaths().sort()).toEqual(['/', '/other']);
    const server = ui.run({
      port: 0,
      app: { title: 'T', nav: ui.navFromPages() },
    });
    try {
      expect(ui.navFromPages().map((n) => n.href)).toEqual(['/', '/other']);
    } finally {
      server.stop();
    }
  });

  test('applyDirRunConfig merges _run.ts configureRun', async () => {
    const merged = await applyDirRunConfig(pagesWithRunFixture, {
      port: 4000,
      title: 'T',
      clientDir: '/tmp/client',
    });
    expect(merged.authSecret).toBe('fixture-auth-secret');
    expect(merged.sessionExpiredPath).toBe('/login');
    expect(merged.port).toBe(4000);
    expect(merged.clientDir).toBe('/tmp/client');
  });

  test('applyDirRunConfig is a no-op without _run.ts', async () => {
    const base = { port: 3000, title: 'X' };
    const merged = await applyDirRunConfig(pagesFixture, base);
    expect(merged).toEqual(base);
  });
});
