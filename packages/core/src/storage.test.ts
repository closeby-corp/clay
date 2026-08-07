import { describe, expect, test, beforeEach } from 'bun:test';
import {
  ClientSession,
  clearPages,
  createMemoryPersistence,
  page,
  resetIdSequence,
  runWithSession,
  setCurrentSession,
  storage,
  type PersistenceAdapter,
} from '@badui/core';

beforeEach(() => {
  clearPages();
  resetIdSequence();
  storage.clearAll();
  page('/storage-test', () => {});
});

describe('storage.tab', () => {
  test('get/set survive within the session and clear on destroy', () => {
    const session = new ClientSession('/storage-test', () => {});
    session.mount();

    runWithSession(session, () => {
      expect(storage.tab.get('n')).toBeUndefined();
      storage.tab.set('n', 1);
      expect(storage.tab.get<number>('n')).toBe(1);
      expect(storage.tab.has('n')).toBe(true);
    });

    expect(session.tab.get('n')).toBe(1);

    session.destroy();
    expect(session.tab.size).toBe(0);
  });

  test('write-through pushes clientStorage ops with scope tab', () => {
    const messages: unknown[] = [];
    const session = new ClientSession('/storage-test', (m) => messages.push(m));
    session.mount();
    messages.length = 0;

    runWithSession(session, () => {
      storage.tab.set('draft', { n: 1 });
      storage.tab.delete('draft');
      storage.tab.set('x', 2);
      storage.tab.clear();
    });

    expect(messages).toEqual([
      { op: 'clientStorage', scope: 'tab', action: 'set', key: 'draft', value: { n: 1 } },
      { op: 'clientStorage', scope: 'tab', action: 'delete', key: 'draft' },
      { op: 'clientStorage', scope: 'tab', action: 'set', key: 'x', value: 2 },
      { op: 'clientStorage', scope: 'tab', action: 'clear' },
    ]);
    expect(session.tab.size).toBe(0);
  });

  test('hydrate from map values used after hello-style seed', () => {
    const session = new ClientSession('/storage-test', () => {});
    session.tab.set('files', [{ name: 'a.txt' }]);
    session.mount();

    runWithSession(session, () => {
      expect(storage.tab.get<{ name: string }[]>('files')).toEqual([{ name: 'a.txt' }]);
    });
  });
});

describe('storage.browser / storage.client', () => {
  test('mirror maps + push clientStorage ops', () => {
    const messages: unknown[] = [];
    const session = new ClientSession('/storage-test', (m) => messages.push(m));
    session.browser.set('pre', 1);
    session.mount();
    messages.length = 0;

    runWithSession(session, () => {
      expect(storage.browser.get<number>('pre')).toBe(1);
      storage.browser.set('theme', 'dark');
      storage.client.set('draft', 'hello');
      expect(storage.client.get('draft')).toBe('hello');
      storage.browser.delete('theme');
      storage.client.clear();
    });

    expect(messages).toEqual([
      { op: 'clientStorage', scope: 'browser', action: 'set', key: 'theme', value: 'dark' },
      { op: 'clientStorage', scope: 'client', action: 'set', key: 'draft', value: 'hello' },
      { op: 'clientStorage', scope: 'browser', action: 'delete', key: 'theme' },
      { op: 'clientStorage', scope: 'client', action: 'clear' },
    ]);
    expect(session.browser.has('theme')).toBe(false);
    expect(session.client.size).toBe(0);
  });
});

describe('storage.user', () => {
  test('requires userId on the session', async () => {
    const session = new ClientSession('/storage-test', () => {});
    session.mount();
    setCurrentSession(session);
    try {
      await expect(storage.user.get('x')).rejects.toThrow(/userId/);
    } finally {
      setCurrentSession(null);
    }
  });

  test('persists bag via adapter under user:<id>', async () => {
    const memory = createMemoryPersistence();
    storage.configure({ user: memory });

    const session = new ClientSession('/storage-test', () => {});
    session.userId = 'user-abc';
    session.mount();

    setCurrentSession(session);
    try {
      await storage.user.set('theme', 'dark');
      expect(await storage.user.get<string>('theme')).toBe('dark');
      expect(await storage.user.has('theme')).toBe(true);
    } finally {
      setCurrentSession(null);
    }

    expect(await memory.load('user:user-abc')).toBe(JSON.stringify({ theme: 'dark' }));

    setCurrentSession(session);
    try {
      await storage.user.delete('theme');
      expect(await storage.user.get('theme')).toBeUndefined();
    } finally {
      setCurrentSession(null);
    }
  });

  test('memory fallback without configure', async () => {
    const session = new ClientSession('/storage-test', () => {});
    session.userId = 'u1';
    session.mount();

    setCurrentSession(session);
    try {
      await storage.user.set('count', 3);
      expect(await storage.user.get<number>('count')).toBe(3);
    } finally {
      setCurrentSession(null);
    }
  });
});

describe('storage.app without adapter', () => {
  test('create is memory-only; get is async', async () => {
    const count = storage.app.create('count', 0);
    expect(await count.get()).toBe(0);
    await count.set(3);
    expect(await count.get()).toBe(3);
    await count.update((n) => n + 1);
    expect(await count.get()).toBe(4);
  });

  test('same key returns same instance', () => {
    const a = storage.app.create('x', 1);
    const b = storage.app.create('x', 99);
    expect(a).toBe(b);
  });
});

describe('storage.app with persistence', () => {
  test('defaults to persist when adapter configured', async () => {
    const memory = createMemoryPersistence();
    storage.configure({ app: memory });

    const messages = storage.app.create<string[]>('chatMessages', []);
    await messages.set(['hi']);
    expect(await memory.load('chatMessages')).toBe(JSON.stringify(['hi']));
  });

  test('opt-out with persist: false does not save', async () => {
    const memory = createMemoryPersistence();
    storage.configure({ app: memory });

    const online = storage.app.create<string[]>('online', [], { persist: false });
    await online.set(['Ada']);
    expect(await memory.load('online')).toBeNull();
    expect(await online.get()).toEqual(['Ada']);
  });

  test('get reloads value written externally to the adapter', async () => {
    const memory = createMemoryPersistence();
    storage.configure({ app: memory });

    const store = storage.app.create<number>('n', 0);
    expect(await store.get()).toBe(0);

    await memory.save('n', JSON.stringify(42));
    expect(await store.get()).toBe(42);
  });

  test('get notifies subscribers when adapter value changes', async () => {
    const memory = createMemoryPersistence();
    storage.configure({ app: memory });

    const store = storage.app.create<number>('watched', 1);
    const seen: number[] = [];
    store.subscribe((v) => seen.push(v));

    await memory.save('watched', JSON.stringify(7));
    await store.get();
    expect(seen).toEqual([7]);
  });

  test('round-trip set then get via adapter', async () => {
    const memory = createMemoryPersistence();
    storage.configure({ app: memory });

    const store = storage.app.create<{ a: number }>('obj', { a: 0 });
    await store.set({ a: 5 });

    storage.clearAll();
    storage.configure({ app: memory });
    const again = storage.app.create<{ a: number }>('obj', { a: 0 });
    expect(await again.get()).toEqual({ a: 5 });
  });

  test('custom adapter load/save is used', async () => {
    const writes: Array<{ key: string; json: string }> = [];
    const adapter: PersistenceAdapter = {
      async load(key) {
        const hit = writes.findLast((w) => w.key === key);
        return hit?.json ?? null;
      },
      async save(key, json) {
        writes.push({ key, json });
      },
    };
    storage.configure({ app: adapter });
    const s = storage.app.create('k', 'init');
    await s.set('next');
    expect(writes).toEqual([{ key: 'k', json: '"next"' }]);
    expect(await s.get()).toBe('next');
  });
});

describe('storage.configure', () => {
  test('partial configure does not clear the other adapter', async () => {
    const userMem = createMemoryPersistence();
    const appMem = createMemoryPersistence();

    storage.configure({ user: userMem });
    storage.configure({ app: appMem });

    const session = new ClientSession('/storage-test', () => {});
    session.userId = 'u-merge';
    session.mount();

    setCurrentSession(session);
    try {
      await storage.user.set('theme', 'dark');
    } finally {
      setCurrentSession(null);
    }

    const messages = storage.app.create<string[]>('chatMessages', []);
    await messages.set(['hi']);

    expect(await userMem.load('user:u-merge')).toBe(JSON.stringify({ theme: 'dark' }));
    expect(await appMem.load('chatMessages')).toBe(JSON.stringify(['hi']));
  });

  test('single call with both adapters', async () => {
    const userMem = createMemoryPersistence();
    const appMem = createMemoryPersistence();
    storage.configure({ user: userMem, app: appMem });

    const session = new ClientSession('/storage-test', () => {});
    session.userId = 'u-both';
    session.mount();

    setCurrentSession(session);
    try {
      await storage.user.set('a', 1);
    } finally {
      setCurrentSession(null);
    }

    await storage.app.create('k', 0).set(9);

    expect(await userMem.load('user:u-both')).toBe(JSON.stringify({ a: 1 }));
    expect(await appMem.load('k')).toBe('9');
  });
});
