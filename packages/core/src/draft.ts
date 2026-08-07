import { reactive, subscribe } from './reactive';
import { storage, type BrowserClientStorage, type TabStorage } from './storage';

/** Sync storage scopes suitable for page-builder drafts (not async user/app). */
export type DraftStorage = 'tab' | 'client' | 'browser';

export type DraftOptions<T extends Record<string, unknown>> = {
  /** Where to persist. Default `'tab'` (survives reconnect via sessionStorage). */
  storage?: DraftStorage;
  /** Keys never read from or written to storage (e.g. passwords). */
  omit?: (keyof T)[];
};

function scopeStore(scope: DraftStorage): TabStorage | BrowserClientStorage {
  if (scope === 'browser') return storage.browser;
  if (scope === 'client') return storage.client;
  return storage.tab;
}

function snapshot<T extends Record<string, unknown>>(
  state: T,
  keys: string[],
  omit: Set<string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (omit.has(k)) continue;
    out[k] = state[k];
  }
  return out;
}

/**
 * Reactive object hydrated from sync storage and write-through on each property change.
 *
 * @example
 * ```ts
 * const form = draft('formDemo', { name: '', email: '' });
 * form.name = 'Ada'; // persisted to storage.tab
 * draft.clear('formDemo');
 * ```
 */
export function draft<T extends Record<string, unknown>>(
  key: string,
  defaults: T,
  opts: DraftOptions<T> = {},
): T {
  const scope = opts.storage ?? 'tab';
  const omit = new Set((opts.omit ?? []).map(String));
  const keys = Object.keys(defaults);
  const store = scopeStore(scope);

  const initial = { ...defaults } as T;
  const saved = store.get<Record<string, unknown>>(key);
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    for (const k of keys) {
      if (omit.has(k)) continue;
      if (Object.prototype.hasOwnProperty.call(saved, k)) {
        (initial as Record<string, unknown>)[k] = saved[k];
      }
    }
  }

  const state = reactive(initial);

  const persist = () => {
    store.set(key, snapshot(state, keys, omit));
  };

  for (const k of keys) {
    if (omit.has(k)) continue;
    subscribe(state, k, persist);
  }

  return state;
}

draft.clear = function clear(key: string, storageScope: DraftStorage = 'tab'): void {
  scopeStore(storageScope).delete(key);
};
