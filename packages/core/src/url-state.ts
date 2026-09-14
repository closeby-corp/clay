import { state, subscribe } from './reactive';
import { getCurrentSession } from './context';
import { getUrlSearch, updateUrlSearch, type SetUrlSearchOptions } from './helpers';

/** Values that round-trip cleanly through the query string. */
export type UrlStateValue = string | number | boolean;

export type UrlStateOptions<T extends Record<string, UrlStateValue>> = {
  /** History write mode for syncs. Default `replace`. */
  mode?: SetUrlSearchOptions['mode'];
  /**
   * Map state keys → query param names.
   * Default: same name (`partner` ↔ `?partner=`).
   */
  keys?: Partial<{ [K in keyof T & string]: string }>;
  /**
   * When true (default), keys whose value equals the default are omitted
   * from the URL (deleted if present). Keeps share links short.
   */
  omitDefaults?: boolean;
};

function urlKeyFor<T extends Record<string, UrlStateValue>>(
  key: keyof T & string,
  opts?: UrlStateOptions<T>,
): string {
  return opts?.keys?.[key] ?? key;
}

function coerceFromUrl<V extends UrlStateValue>(raw: string, fallback: V): V {
  // Present-but-empty (`?page=`) → keep the default, not Number('') === 0.
  if (raw === '') return fallback;
  if (typeof fallback === 'boolean') {
    if (raw === 'true' || raw === '1') return true as V;
    if (raw === 'false' || raw === '0') return false as V;
    return fallback;
  }
  if (typeof fallback === 'number') {
    const n = Number(raw);
    return (Number.isFinite(n) ? n : fallback) as V;
  }
  return raw as V;
}

function hydrateFromSearch<T extends Record<string, UrlStateValue>>(
  defaults: T,
  opts?: UrlStateOptions<T>,
  search?: string,
): T {
  const params = new URLSearchParams(search ?? getUrlSearch());
  const initial = { ...defaults };
  for (const key of Object.keys(defaults) as Array<keyof T & string>) {
    const raw = params.get(urlKeyFor(key, opts));
    if (raw == null) continue;
    initial[key] = coerceFromUrl(raw, defaults[key]);
  }
  return initial;
}

function buildPatch<T extends Record<string, UrlStateValue>>(
  current: T,
  defaults: T,
  opts?: UrlStateOptions<T>,
): Record<string, string | null> {
  const omitDefaults = opts?.omitDefaults !== false;
  const patch: Record<string, string | null> = {};
  for (const key of Object.keys(defaults) as Array<keyof T & string>) {
    const urlKey = urlKeyFor(key, opts);
    const value = current[key];
    if (omitDefaults && Object.is(value, defaults[key])) {
      patch[urlKey] = null;
    } else {
      patch[urlKey] = String(value);
    }
  }
  return patch;
}

/**
 * Reactive object like {@link state}, hydrated from `location.search` and
 * write-through synced via {@link updateUrlSearch}.
 *
 * Re-hydrates in place on browser Back/Forward (`urlchange`) without remounting.
 *
 * @example
 * ```ts
 * const filters = ui.urlState({
 *   tab: 'dashboard',
 *   partner: '',
 *   page: 1,
 * });
 * filters.partner = 'UBER'; // → ?partner=UBER (defaults omitted)
 * ```
 */
export function urlState<T extends Record<string, UrlStateValue>>(
  defaults: T,
  opts?: UrlStateOptions<T>,
): T {
  // Capture session now — microtask flushes run outside `runWithSession`.
  const session = getCurrentSession();
  const s = state(hydrateFromSearch(defaults, opts, session?.urlSearch));

  let applying = false;
  let queued = false;
  const flush = () => {
    queued = false;
    if (applying) return;
    const patch = buildPatch(s, defaults, opts);
    const mode = opts?.mode ?? 'replace';
    if (session) {
      const params = new URLSearchParams(session.urlSearch);
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === '') params.delete(key);
        else params.set(key, value);
      }
      session.setUrlSearch(params.toString(), { mode });
      return;
    }
    updateUrlSearch(patch, { mode });
  };
  const schedule = () => {
    if (applying || queued) return;
    queued = true;
    queueMicrotask(flush);
  };

  for (const key of Object.keys(defaults)) {
    subscribe(s, key, schedule);
  }

  if (session) {
    session.onUrlChange(() => {
      applying = true;
      try {
        const next = hydrateFromSearch(defaults, opts, session.urlSearch);
        for (const key of Object.keys(defaults) as Array<keyof T & string>) {
          if (!Object.is(s[key], next[key])) {
            s[key] = next[key];
          }
        }
      } finally {
        applying = false;
      }
    });
  }

  return s;
}
