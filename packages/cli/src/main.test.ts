import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { clearPages, getRegisteredPaths, setPageWrapper } from '@badui/core';
import { ui, resetRunState, wasRunCalled } from '@badui/ui';

const fixtures = join(fileURLToPath(new URL('.', import.meta.url)), '../fixtures');
const pagesFixture = join(fixtures, 'pages');

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

describe('badui CLI entry shapes', () => {
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
});
