import type { PersistenceAdapter } from '@badui/core';

/** Minimal Redis surface used by the adapter (ioredis, node-redis, Bun, mocks). */
export type RedisLikeClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  quit?(): Promise<unknown>;
  disconnect?(): void;
};

export type RedisPersistenceOptions = {
  client: RedisLikeClient;
  /**
   * Prefix for all keys (default `badui:`).
   * App stores use `${prefix}${key}`; user bags already include `user:` in the key.
   */
  keyPrefix?: string;
};

/**
 * Redis-backed PersistenceAdapter for `storage.configure({ app, user })`.
 *
 * Suitable for multi-process / horizontal scaling of `storage.app` and
 * `storage.user`. WebSocket sessions remain sticky to a single process —
 * pair with a sticky load balancer or accept remount on reconnect.
 *
 * @example
 * ```ts
 * import { storage } from '@badui/core';
 * import { createRedisPersistence } from '@badui/persistence-redis';
 * import Redis from 'ioredis';
 *
 * const redis = new Redis(process.env.REDIS_URL!);
 * const adapter = createRedisPersistence({ client: redis });
 * storage.configure({ app: adapter, user: adapter });
 * ```
 */
export function createRedisPersistence(
  options: RedisPersistenceOptions,
): PersistenceAdapter {
  const prefix = options.keyPrefix ?? 'badui:';
  const { client } = options;

  function fullKey(key: string): string {
    return `${prefix}${key}`;
  }

  return {
    async load(key: string): Promise<string | null> {
      return client.get(fullKey(key));
    },
    async save(key: string, json: string): Promise<void> {
      await client.set(fullKey(key), json);
    },
    async close(): Promise<void> {
      if (typeof client.quit === 'function') {
        await client.quit();
      } else if (typeof client.disconnect === 'function') {
        client.disconnect();
      }
    },
  };
}
