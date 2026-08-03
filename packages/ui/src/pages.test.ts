import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { getRegisteredPaths, setPageWrapper } from '@badui/core';
import { loadPages, navFromPages, resetPageDiscovery } from './pages.ts';

const fixturesPages = join(fileURLToPath(new URL('.', import.meta.url)), '__fixtures__/pages');
const fixturesHomeOrder = join(
  fileURLToPath(new URL('.', import.meta.url)),
  '__fixtures__/pages-home-order',
);

beforeEach(() => {
  resetPageDiscovery();
  setPageWrapper(null);
});

afterEach(() => {
  resetPageDiscovery();
  setPageWrapper(null);
});

describe('loadPages + navFromPages', () => {
  test('imports page modules and builds ordered nav', async () => {
    await loadPages(fixturesPages);

    expect(getRegisteredPaths().sort()).toEqual([
      '/',
      '/examples/alpha',
      '/examples/zeta',
    ]);

    const nav = navFromPages();
    expect(nav.map((n) => n.href)).toEqual([
      '/',
      '/examples/alpha',
      '/examples/zeta',
    ]);
    expect(nav[0]).toMatchObject({ label: 'Home', icon: 'house' });
    expect(nav[1]).toMatchObject({ label: 'Alpha', icon: 'activity' });
    expect(nav[2]).toMatchObject({ label: 'Zeta', icon: 'zap' });
  });

  test('forces / first even with high order meta', async () => {
    await loadPages(fixturesHomeOrder);
    expect(navFromPages().map((n) => n.href)).toEqual(['/', '/early']);
  });
});
