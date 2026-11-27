import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  ClientSession,
  clearPages,
  getRegisteredPaths,
  setPageGate,
  setPageWrapper,
  setRoleResolver,
} from '@close-by/clay-core';
import { ui, resetPageDiscovery, resetRunState, wasRunCalled } from '@close-by/clay';
import { applyDirRunConfig, buildRunConfig, mergeCliTailwind } from './main.ts';

const fixtures = join(fileURLToPath(new URL('.', import.meta.url)), '../fixtures');
const pagesFixture = join(fixtures, 'pages');
const pagesWithRunFixture = join(fixtures, 'pages-with-run');
const pagesRolesFixture = join(fixtures, 'pages-roles');

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

  test('--app shell nav is built per page, filtered by getRoles', async () => {
    await ui.loadPages(pagesRolesFixture);
    let roles: string[] = [];
    const server = ui.run({
      ...buildRunConfig({ port: 0, title: 'T', app: true }),
      tailwind: false,
      getRoles: () => roles,
    });
    type Node = { type: string; props: Record<string, unknown>; children: Node[] };
    const find = (node: Node): Node | undefined =>
      node.type === 'app' ? node : node.children?.map(find).find(Boolean);
    const navHrefs = () => {
      let tree!: Node;
      new ClientSession('/', (msg) => {
        if (msg.op === 'mount') tree = msg.tree as Node;
      }).mount();
      return (find(tree)!.props.nav as { href: string }[]).map((n) => n.href);
    };
    try {
      roles = ['admin'];
      expect(navHrefs()).toEqual(['/', '/admin']);
      roles = [];
      expect(navHrefs()).toEqual(['/']);
    } finally {
      server.stop();
      setPageGate(null);
      setRoleResolver(null);
      resetPageDiscovery();
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

  test('mergeCliTailwind keeps configureRun appendCss', () => {
    const merged = mergeCliTailwind(
      {
        port: 3000,
        tailwind: { appendCss: '/* theme */', content: ['./custom'] },
      },
      { contentRoot: '/pages', watch: true, enabled: true },
    );
    expect(merged.tailwind).toEqual({
      appendCss: '/* theme */',
      content: ['./custom'],
      watch: true,
    });
  });

  test('mergeCliTailwind fills content when configureRun omitted it', () => {
    const merged = mergeCliTailwind(
      { port: 3000, tailwind: { appendCss: 'x' } },
      { contentRoot: '/pages', watch: false, enabled: true },
    );
    expect(merged.tailwind).toMatchObject({
      appendCss: 'x',
      content: ['/pages'],
      watch: false,
    });
  });
});
