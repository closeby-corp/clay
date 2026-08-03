import { describe, expect, test, beforeEach } from 'bun:test';
import {
  GlobalState,
  createMemoryPersistence,
  type PersistenceAdapter,
} from './global-state.ts';

beforeEach(() => {
  GlobalState.clearAll();
});

describe('GlobalState without adapter', () => {
  test('create is memory-only; get is async', async () => {
    const count = GlobalState.create('count', 0);
    expect(await count.get()).toBe(0);
    await count.set(3);
    expect(await count.get()).toBe(3);
    await count.update((n) => n + 1);
    expect(await count.get()).toBe(4);
  });

  test('same key returns same instance', () => {
    const a = GlobalState.create('x', 1);
    const b = GlobalState.create('x', 99);
    expect(a).toBe(b);
  });
});

describe('GlobalState with persistence', () => {
  test('defaults to persist when adapter configured', async () => {
    const memory = createMemoryPersistence();
    await GlobalState.configure({ persistence: memory });

    const messages = GlobalState.create<string[]>('chatMessages', []);
    await messages.set(['hi']);
    expect(await memory.load('chatMessages')).toBe(JSON.stringify(['hi']));
  });

  test('opt-out with persist: false does not save', async () => {
    const memory = createMemoryPersistence();
    await GlobalState.configure({ persistence: memory });

    const online = GlobalState.create<string[]>('online', [], { persist: false });
    await online.set(['Ada']);
    expect(await memory.load('online')).toBeNull();
    expect(await online.get()).toEqual(['Ada']);
  });

  test('get reloads value written externally to the adapter', async () => {
    const memory = createMemoryPersistence();
    await GlobalState.configure({ persistence: memory });

    const store = GlobalState.create<number>('n', 0);
    expect(await store.get()).toBe(0);

    await memory.save('n', JSON.stringify(42));
    expect(await store.get()).toBe(42);
  });

  test('get notifies subscribers when adapter value changes', async () => {
    const memory = createMemoryPersistence();
    await GlobalState.configure({ persistence: memory });

    const store = GlobalState.create<number>('watched', 1);
    const seen: number[] = [];
    store.subscribe((v) => seen.push(v));

    await memory.save('watched', JSON.stringify(7));
    await store.get();
    expect(seen).toEqual([7]);
  });

  test('round-trip set then get via adapter', async () => {
    const memory = createMemoryPersistence();
    await GlobalState.configure({ persistence: memory });

    const store = GlobalState.create<{ a: number }>('obj', { a: 0 });
    await store.set({ a: 5 });

    GlobalState.clearAll();
    await GlobalState.configure({ persistence: memory });
    const again = GlobalState.create<{ a: number }>('obj', { a: 0 });
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
    await GlobalState.configure({ persistence: adapter });
    const s = GlobalState.create('k', 'init');
    await s.set('next');
    expect(writes).toEqual([{ key: 'k', json: '"next"' }]);
    expect(await s.get()).toBe('next');
  });
});
