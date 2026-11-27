import { afterEach, describe, expect, test } from 'bun:test';
import {
  ClientSession,
  setPageGate,
  setPageWrapper,
  setRoleResolver,
} from '@close-by/clay-core';
import { attachPageMeta, page, resetPageDiscovery, resetRunState, run, type RunConfig } from './index.ts';

type Node = { type: string; props: Record<string, unknown>; children: Node[] };

let roles: string[] = [];

afterEach(() => {
  setPageGate(null);
  setRoleResolver(null);
  setPageWrapper(null);
  resetPageDiscovery();
  resetRunState();
});

function mountTree(path: string, config: RunConfig): Node {
  const server = run({ port: 0, tailwind: false, ...config });
  try {
    let tree: Node | undefined;
    new ClientSession(path, (msg) => {
      if ((msg as { op: string }).op === 'mount') tree = (msg as unknown as { tree: Node }).tree;
    }).mount();
    return tree!;
  } finally {
    server.stop();
  }
}

function find(node: Node, type: string): Node | undefined {
  if (node.type === type) return node;
  for (const child of node.children ?? []) {
    const hit = find(child, type);
    if (hit) return hit;
  }
  return undefined;
}

function registerAdmin(options?: { shell?: boolean }): string[] {
  const built: string[] = [];
  page('/admin', () => void built.push('admin'), options);
  attachPageMeta('/admin', { roles: ['admin'] });
  return built;
}

describe('pageMeta.roles page gate', () => {
  test('session without the role gets the default forbidden view, not the page', () => {
    const built = registerAdmin();
    roles = ['viewer'];
    const tree = mountTree('/admin', { getRoles: () => roles });
    expect(built).toEqual([]);
    const empty = find(tree, 'empty');
    expect(empty?.props.title).toBe('Not allowed');
  });

  test('session with the role builds the page', () => {
    const built = registerAdmin();
    roles = ['admin'];
    const tree = mountTree('/admin', { getRoles: () => roles });
    expect(built).toEqual(['admin']);
    expect(find(tree, 'empty')).toBeUndefined();
  });

  test('custom forbidden hook receives the path and renders inside the app shell', () => {
    const built = registerAdmin();
    roles = [];
    const calls: string[] = [];
    const tree = mountTree('/admin', {
      getRoles: () => roles,
      app: { title: 'T' },
      forbidden: (path) => void calls.push(path),
    });
    expect(built).toEqual([]);
    expect(calls).toEqual(['/admin']);
    expect(find(tree, 'app')).toBeDefined();
  });

  test('shell: false pages are gated too', () => {
    const built = registerAdmin({ shell: false });
    roles = ['viewer'];
    const tree = mountTree('/admin', { getRoles: () => roles, app: { title: 'T' } });
    expect(built).toEqual([]);
    expect(find(tree, 'app')).toBeUndefined();
    expect(find(tree, 'empty')).toBeDefined();
  });

  test('without getRoles the page still builds (nav filtering only)', () => {
    const built = registerAdmin();
    mountTree('/admin', {});
    expect(built).toEqual(['admin']);
  });
});

describe('app shell without nav', () => {
  test('uses navFromPages() per build, filtered by the session roles', () => {
    page('/', () => {});
    registerAdmin();
    const hrefs = (r: string[]) => {
      roles = r;
      const tree = mountTree('/', { getRoles: () => roles, app: { title: 'T' } });
      return (find(tree, 'app')!.props.nav as { href: string }[]).map((n) => n.href);
    };
    expect(hrefs(['admin'])).toEqual(['/', '/admin']);
    expect(hrefs([])).toEqual(['/']);
  });
});
