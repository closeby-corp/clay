import { describe, expect, test } from 'bun:test';
import { createMemoryPersistence, storage, AppStore } from '@badui/core';
import { createRedisPersistence, type RedisLikeClient } from './redis-persistence';

function memoryRedis(): RedisLikeClient & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    async get(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    async set(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('createRedisPersistence', () => {
  test('load/save round-trip with prefix', async () => {
    const redis = memoryRedis();
    const adapter = createRedisPersistence({ client: redis, keyPrefix: 't:' });
    await adapter.save('k', JSON.stringify({ n: 1 }));
    expect(redis.store.get('t:k')).toBe(JSON.stringify({ n: 1 }));
    expect(await adapter.load('k')).toBe(JSON.stringify({ n: 1 }));
    expect(await adapter.load('missing')).toBeNull();
  });

  test('works as storage.app PersistenceAdapter', async () => {
    storage.clearAll();
    const redis = memoryRedis();
    storage.configure({ app: createRedisPersistence({ client: redis }) });
    const count = storage.app.create('counter', 0);
    await count.set(7);
    expect(await redis.get('badui:counter')).toBe('7');
    AppStore.clearAll();
    const again = storage.app.create('counter', 0);
    expect(await again.get()).toBe(7);
    storage.clearAll();
  });

  test('memory PersistenceAdapter still available for comparison', async () => {
    const mem = createMemoryPersistence();
    await mem.save('a', '1');
    expect(await mem.load('a')).toBe('1');
  });
});
