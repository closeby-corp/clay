type Listener<T> = (value: T) => void;

/** Pluggable KV backend for persisted GlobalState keys (JSON text). */
export type PersistenceAdapter = {
  /** Read one key; `null` means missing. */
  load(key: string): Promise<string | null>;
  /** Write one key as JSON text. */
  save(key: string, json: string): Promise<void>;
  close?(): Promise<void>;
};

export type GlobalStateCreateOptions = {
  /**
   * When an adapter is configured, defaults to `true`.
   * Pass `false` to keep the store memory-only.
   * When no adapter is configured, always memory-only.
   */
  persist?: boolean;
};

export type GlobalStateConfigureOptions = {
  persistence: PersistenceAdapter;
};

const stores = new Map<string, GlobalState<unknown>>();
let persistenceAdapter: PersistenceAdapter | null = null;

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

export class GlobalState<T> {
  private value: T;
  private listeners = new Set<Listener<T>>();
  private readonly key: string;
  private readonly shouldPersist: boolean;

  private constructor(key: string, initial: T, shouldPersist: boolean) {
    this.key = key;
    this.value = initial;
    this.shouldPersist = shouldPersist;
  }

  static async configure(options: GlobalStateConfigureOptions): Promise<void> {
    persistenceAdapter = options.persistence;
  }

  static create<T>(
    key: string,
    initial: T,
    options: GlobalStateCreateOptions = {},
  ): GlobalState<T> {
    const existing = stores.get(key) as GlobalState<T> | undefined;
    if (existing) return existing;

    const shouldPersist =
      options.persist ?? persistenceAdapter !== null;
    const state = new GlobalState(key, initial, shouldPersist);
    stores.set(key, state as GlobalState<unknown>);
    return state;
  }

  static clearAll(): void {
    stores.clear();
    persistenceAdapter = null;
  }

  /**
   * Read the value. Persisted stores always `load` from the adapter first
   * so external writers are visible.
   */
  async get(): Promise<T> {
    if (this.shouldPersist && persistenceAdapter) {
      try {
        const json = await persistenceAdapter.load(this.key);
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
        console.error(`[GlobalState] load failed for "${this.key}"`, err);
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
    if (!this.shouldPersist || !persistenceAdapter) return;
    try {
      await persistenceAdapter.save(this.key, JSON.stringify(value));
    } catch (err) {
      console.error(`[GlobalState] save failed for "${this.key}"`, err);
    }
  }
}
