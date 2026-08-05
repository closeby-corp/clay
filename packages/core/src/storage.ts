import { getCurrentSession } from './context';
import type { PersistenceAdapter } from './global-state';

export type TabStorage = {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  delete(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
};

export type UserStorage = {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
};

export type StorageConfigureOptions = {
  /** Persist per-user JSON bags (`user:<id>` keys). */
  persistence: PersistenceAdapter;
};

let userPersistence: PersistenceAdapter | null = null;
const memoryBags = new Map<string, Record<string, unknown>>();

function tabApi(): TabStorage {
  return {
    get<T = unknown>(key: string): T | undefined {
      const session = getCurrentSession();
      if (!session) return undefined;
      return session.tab.get(key) as T | undefined;
    },
    set(key: string, value: unknown): void {
      const session = getCurrentSession();
      if (!session) return;
      session.tab.set(key, value);
    },
    delete(key: string): boolean {
      return getCurrentSession()?.tab.delete(key) ?? false;
    },
    clear(): void {
      getCurrentSession()?.tab.clear();
    },
    has(key: string): boolean {
      return getCurrentSession()?.tab.has(key) ?? false;
    },
  };
}

function requireUserId(): string {
  const session = getCurrentSession();
  if (!session?.userId) {
    throw new Error('User storage requires an active session with a userId (sent on hello)');
  }
  return session.userId;
}

function bagKey(userId: string): string {
  return `user:${userId}`;
}

async function loadBag(userId: string): Promise<Record<string, unknown>> {
  if (userPersistence) {
    const raw = await userPersistence.load(bagKey(userId));
    if (raw == null) return {};
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return { ...(memoryBags.get(userId) ?? {}) };
}

async function saveBag(userId: string, bag: Record<string, unknown>): Promise<void> {
  if (userPersistence) {
    await userPersistence.save(bagKey(userId), JSON.stringify(bag));
    return;
  }
  memoryBags.set(userId, bag);
}

const userApi: UserStorage = {
  async get<T = unknown>(key: string): Promise<T | undefined> {
    const userId = requireUserId();
    const bag = await loadBag(userId);
    return bag[key] as T | undefined;
  },
  async set(key: string, value: unknown): Promise<void> {
    const userId = requireUserId();
    const bag = await loadBag(userId);
    bag[key] = value;
    await saveBag(userId, bag);
  },
  async delete(key: string): Promise<void> {
    const userId = requireUserId();
    const bag = await loadBag(userId);
    delete bag[key];
    await saveBag(userId, bag);
  },
  async clear(): Promise<void> {
    const userId = requireUserId();
    await saveBag(userId, {});
  },
  async has(key: string): Promise<boolean> {
    const userId = requireUserId();
    const bag = await loadBag(userId);
    return Object.prototype.hasOwnProperty.call(bag, key);
  },
};

/**
 * Lightweight session storage (NiceGUI-ish `app.storage.tab` / `user`).
 *
 * - **tab** — in-memory `Map` on the current `ClientSession` (survives `refreshable` rebuilds; cleared on session destroy)
 * - **user** — JSON bag keyed by client `userId` (localStorage), optionally file-backed via `configure`
 */
export const storage = {
  get tab(): TabStorage {
    return tabApi();
  },
  user: userApi,

  configure(options: StorageConfigureOptions): void {
    userPersistence = options.persistence;
  },

  /** Test helper: clear adapter + in-memory bags. */
  clearAll(): void {
    userPersistence = null;
    memoryBags.clear();
  },
};
