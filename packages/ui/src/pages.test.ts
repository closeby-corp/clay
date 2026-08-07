import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { getRegisteredPaths, page, setPageWrapper } from '@badui/core';
import {
  attachPageMeta,
  loadPages,
  navFromPages,
  resetPageDiscovery,
} from './pages.ts';

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
      '/examples/admin-only',
      '/examples/alpha',
      '/examples/hidden',
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

  test('filters pages by pageMeta.roles', () => {
    page('/', () => {});
    page('/examples/alpha', () => {});
    page('/examples/admin-only', () => {});
    attachPageMeta('/', { label: 'Home', icon: 'house', order: 0 });
    attachPageMeta('/examples/alpha', { label: 'Alpha', icon: 'activity', order: 10 });
    attachPageMeta('/examples/admin-only', {
      label: 'Admin Only',
      icon: 'shield',
      order: 50,
      roles: ['admin'],
    });

    expect(navFromPages({ role: 'user' }).map((n) => n.href)).toEqual([
      '/',
      '/examples/alpha',
    ]);
    expect(navFromPages({ role: 'admin' }).map((n) => n.href)).toEqual([
      '/',
      '/examples/alpha',
      '/examples/admin-only',
    ]);
    expect(navFromPages({ roles: ['admin', 'user'] }).map((n) => n.href)).toContain(
      '/examples/admin-only',
    );
    expect(navFromPages().map((n) => n.href)).not.toContain('/examples/admin-only');
  });

  test('loadPages clears prior registrations before re-import', async () => {
    page('/stale', () => {});
    expect(getRegisteredPaths()).toContain('/stale');
    await loadPages(fixturesPages);
    expect(getRegisteredPaths()).not.toContain('/stale');
    expect(getRegisteredPaths()).toContain('/');
  });
});
