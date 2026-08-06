import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import {
  ClientSession,
  Element,
  clearPages,
  navigate,
  page,
  resetIdSequence,
  runWithSession,
  setPageWrapper,
  storage,
  type ElementNode,
  type Patch,
  type ServerMessage,
} from './index.ts';

function findByType(node: ElementNode, type: string): ElementNode[] {
  const out: ElementNode[] = [];
  const walk = (n: ElementNode) => {
    if (n.type === type) out.push(n);
    for (const c of n.children) walk(c);
  };
  walk(node);
  return out;
}

beforeEach(() => {
  clearPages();
  setPageWrapper(null);
  resetIdSequence();
  storage.clearAll();
});

afterEach(() => {
  clearPages();
  setPageWrapper(null);
  storage.clearAll();
});

describe('ClientSession mount → event → patch', () => {
  test('mount sends tree for a registered page', () => {
    page('/home', () => {
      new Element('label', { text: 'Hello' });
    });

    const messages: ServerMessage[] = [];
    const session = new ClientSession('/home', (m) => messages.push(m));
    session.mount();

    expect(session.isMounted).toBe(true);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.op).toBe('mount');
    if (messages[0]!.op !== 'mount') return;
    expect(messages[0]!.sessionId).toBe(session.id);
    expect(messages[0]!.tree.type).toBe('root');
    expect(findByType(messages[0]!.tree, 'label')[0]!.props.text).toBe('Hello');
  });

  test('mount errors when path is unregistered', () => {
    const messages: ServerMessage[] = [];
    const session = new ClientSession('/missing', (m) => messages.push(m));
    session.mount();

    expect(session.isMounted).toBe(false);
    expect(messages).toEqual([
      { op: 'error', message: 'No page registered for /missing' },
    ]);
  });

  test('handleMessage event runs handler and flushes patches', async () => {
    let label!: Element;
    page('/counter', () => {
      label = new Element('label', { text: '0' });
      new Element('button', {
        text: 'inc',
        onClick: () => {
          const n = Number(label.props.text) + 1;
          label.setText(String(n));
        },
      });
    });

    const messages: ServerMessage[] = [];
    const session = new ClientSession('/counter', (m) => messages.push(m));
    session.mount();

    const mount = messages.find((m) => m.op === 'mount');
    expect(mount?.op).toBe('mount');
    if (mount?.op !== 'mount') return;
    const button = findByType(mount.tree, 'button')[0]!;
    expect(button).toBeTruthy();

    const before = messages.length;
    await session.handleMessage({ op: 'event', id: button.id, type: 'click' });

    const patches = messages
      .slice(before)
      .filter((m): m is Extract<ServerMessage, { op: 'patch' }> => m.op === 'patch')
      .flatMap((m) => m.patches);

    expect(patches).toContainEqual({
      op: 'updateProps',
      id: label.id,
      props: { text: '1' },
    } satisfies Patch);
    expect(label.props.text).toBe('1');
  });
});

describe('ClientSession navigate remount', () => {
  test('navigate sends navigate op; remount rebuilds tree for new path', () => {
    page('/a', () => {
      new Element('label', { text: 'page-a' });
    });
    page('/b', () => {
      new Element('label', { text: 'page-b' });
    });

    const messages: ServerMessage[] = [];
    const session = new ClientSession('/a', (m) => messages.push(m));
    session.mount();

    runWithSession(session, () => navigate('/b'));
    expect(messages.some((m) => m.op === 'navigate' && m.path === '/b')).toBe(true);

    // Server-side remount path: destroy + new session on hello (client mirrors navigate)
    const userId = 'user-nav-1';
    session.userId = userId;
    session.tab.set('scratch', 42);
    session.destroy();
    expect(session.isMounted).toBe(false);
    expect(session.tab.size).toBe(0);
    expect(session.userId).toBeNull();

    const remountMessages: ServerMessage[] = [];
    const next = new ClientSession('/b', (m) => remountMessages.push(m));
    next.userId = userId;
    next.mount();

    expect(next.isMounted).toBe(true);
    expect(next.userId).toBe(userId);
    const mount = remountMessages.find((m) => m.op === 'mount');
    expect(mount?.op).toBe('mount');
    if (mount?.op !== 'mount') return;
    expect(findByType(mount.tree, 'label')[0]!.props.text).toBe('page-b');
  });
});

describe('ClientSession hello userId + storage.user', () => {
  test('userId from hello enables storage.user across remount', async () => {
    page('/store', () => {
      new Element('button', {
        text: 'save',
        onClick: async () => {
          await storage.user.set('theme', 'dark');
        },
      });
    });
    page('/other', () => {
      new Element('label', { text: 'other' });
    });

    const messages: ServerMessage[] = [];
    const session = new ClientSession('/store', (m) => messages.push(m));
    session.userId = 'uid-42';
    session.mount();

    const mount = messages.find((m) => m.op === 'mount');
    expect(mount?.op).toBe('mount');
    if (mount?.op !== 'mount') return;
    const button = findByType(mount.tree, 'button')[0]!;

    await session.handleMessage({ op: 'event', id: button.id, type: 'click' });

    session.destroy();

    const next = new ClientSession('/other', () => {});
    next.userId = 'uid-42';
    next.mount();

    await runWithSession(next, async () => {
      expect(await storage.user.get<string>('theme')).toBe('dark');
    });
  });
});
