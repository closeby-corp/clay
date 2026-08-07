import { getCurrentSession } from './context';

type Listener<T> = (value: T) => void;

/** Pluggable KV backend for persisted storage keys (JSON text). */
export type PersistenceAdapter = {
  /** Read one key; `null` means missing. */
  load(key: string): Promise<string | null>;
  /** Write one key as JSON text. */
  save(key: string, json: string): Promise<void>;
  close?(): Promise<void>;
};

export type AppStoreCreateOptions = {
  /**
   * When an app adapter is configured, defaults to `true`.
   * Pass `false` to keep the store memory-only.
   * When no app adapter is configured, always memory-only.
   */
  persist?: boolean;
};

export type StorageConfigureOptions = {
  /** Persist process-wide app stores (keys as-is). */
  app?: PersistenceAdapter;
  /** Persist per-user JSON bags (`user:<id>` keys). */
  user?: PersistenceAdapter;
};

/** Per-browser-tab key/value — mirrored to sessionStorage; survives reconnect. */
export type TabStorage = {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  delete(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
};

/** Sync scope mirrored to the browser (localStorage or sessionStorage). */
export type BrowserClientStorage = {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  delete(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
};

/** Async per-user JSON bag keyed by session `userId` (optionally file-backed). */
export type UserStorage = {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
};

const appStores = new Map<string, AppStore<unknown>>();
let appPersistence: PersistenceAdapter | null = null;
let userPersistence: PersistenceAdapter | null = null;
const memoryBags = new Map<string, Record<string, unknown>>();

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/** In-memory PersistenceAdapter for tests and simple embeds. */
export function createMemoryPersistence(
  initial?: Map<string, string> | Record<string, string>,
): PersistenceAdapter {
  const data = new Map<string, string>(
    initial instanceof Map ? initial : Object.entries(initial ?? {}),
  );
  return {
    async load(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    async save(key: string, json: string) {
      data.set(key, json);
    },
  };
}

/** Process-wide typed store (all sessions). Created via `storage.app.create`. */
export class AppStore<T> {
  private value: T;
  private listeners = new Set<Listener<T>>();
  private readonly key: string;
  private readonly shouldPersist: boolean;

  private constructor(key: string, initial: T, shouldPersist: boolean) {
    this.key = key;
    this.value = initial;
    this.shouldPersist = shouldPersist;
  }

  static create<T>(
    key: string,
    initial: T,
    options: AppStoreCreateOptions = {},
  ): AppStore<T> {
    const existing = appStores.get(key) as AppStore<T> | undefined;
    if (existing) return existing;

    const shouldPersist = options.persist ?? appPersistence !== null;
    const state = new AppStore(key, initial, shouldPersist);
    appStores.set(key, state as AppStore<unknown>);
    return state;
  }

  static clearAll(): void {
    appStores.clear();
  }

  /**
   * Read the value. Persisted stores always `load` from the adapter first
   * so external writers are visible.
   */
  async get(): Promise<T> {
    if (this.shouldPersist && appPersistence) {
      try {
        const json = await appPersistence.load(this.key);
        if (json != null) {
          const next = JSON.parse(json) as T;
          if (!valuesEqual(this.value, next)) {
            this.value = next;
            this.notify(next);
          } else {
            this.value = next;
          }
        }
      } catch (err) {
        console.error(`[storage.app] load failed for "${this.key}"`, err);
      }
    }
    return this.value;
  }

  async set(value: T): Promise<void> {
    this.value = value;
    this.notify(value);
    await this.persist(value);
  }

  async update(fn: (prev: T) => T): Promise<void> {
    await this.set(fn(this.value));
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(value: T): void {
    for (const listener of [...this.listeners]) {
      listener(value);
    }
  }

  private async persist(value: T): Promise<void> {
    if (!this.shouldPersist || !appPersistence) return;
    try {
      await appPersistence.save(this.key, JSON.stringify(value));
    } catch (err) {
      console.error(`[storage.app] save failed for "${this.key}"`, err);
    }
  }
}

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
      session.clientStorage('tab', 'set', key, value);
    },
    delete(key: string): boolean {
      const session = getCurrentSession();
      if (!session) return false;
      const existed = session.tab.delete(key);
      if (existed) session.clientStorage('tab', 'delete', key);
      return existed;
    },
    clear(): void {
      const session = getCurrentSession();
      if (!session) return;
      session.tab.clear();
      session.clientStorage('tab', 'clear');
    },
    has(key: string): boolean {
      return getCurrentSession()?.tab.has(key) ?? false;
    },
  };
}

function browserClientApi(scope: 'browser' | 'client'): BrowserClientStorage {
  return {
    get<T = unknown>(key: string): T | undefined {
      const session = getCurrentSession();
      if (!session) return undefined;
      const bag = scope === 'browser' ? session.browser : session.client;
      return bag.get(key) as T | undefined;
    },
    set(key: string, value: unknown): void {
      const session = getCurrentSession();
      if (!session) return;
      const bag = scope === 'browser' ? session.browser : session.client;
      bag.set(key, value);
      session.clientStorage(scope, 'set', key, value);
    },
    delete(key: string): boolean {
      const session = getCurrentSession();
      if (!session) return false;
      const bag = scope === 'browser' ? session.browser : session.client;
      const existed = bag.delete(key);
      if (existed) session.clientStorage(scope, 'delete', key);
      return existed;
    },
    clear(): void {
      const session = getCurrentSession();
      if (!session) return;
      const bag = scope === 'browser' ? session.browser : session.client;
      bag.clear();
      session.clientStorage(scope, 'clear');
    },
    has(key: string): boolean {
      const session = getCurrentSession();
      if (!session) return false;
      const bag = scope === 'browser' ? session.browser : session.client;
      return bag.has(key);
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
 * Lightweight session storage (NiceGUI-ish scopes).
 *
 * - **tab** — in-memory `Map` on the current `ClientSession`, mirrored to client
 *   `sessionStorage` (`badui-tab-storage`); survives reconnect / navigate-hello;
 *   cleared via `tab.clear()` or when the browser tab closes (sessionStorage lifetime)
 * - **browser** — mirrored to client `localStorage` (shared across tabs for the origin)
 * - **client** — mirrored to client `sessionStorage` (this browser tab only)
 * - **user** — JSON bag keyed by client `userId` (localStorage id), optionally file/Redis-backed via `configure`
 * - **app** — process-wide typed stores shared across sessions; optionally file/Redis-backed via `configure`
 */
export const storage = {
  get tab(): TabStorage {
    return tabApi();
  },
  get browser(): BrowserClientStorage {
    return browserClientApi('browser');
  },
  get client(): BrowserClientStorage {
    return browserClientApi('client');
  },
  user: userApi,

  app: {
    create<T>(
      key: string,
      initial: T,
      options?: AppStoreCreateOptions,
    ): AppStore<T> {
      return AppStore.create(key, initial, options);
    },
    /** Test helper: clear app stores only (keeps adapters). */
    clearAll(): void {
      AppStore.clearAll();
    },
  },

  /**
   * Configure persistence adapters. Passing only `app` or only `user`
   * leaves the other adapter unchanged.
   */
  configure(options: StorageConfigureOptions): void {
    if (options.app !== undefined) {
      appPersistence = options.app;
    }
    if (options.user !== undefined) {
      userPersistence = options.user;
    }
  },

  /** Test helper: clear app stores, user bags, and both adapters. */
  clearAll(): void {
    AppStore.clearAll();
    appPersistence = null;
    userPersistence = null;
    memoryBags.clear();
  },
};
