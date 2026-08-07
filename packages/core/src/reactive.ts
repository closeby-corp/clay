type Listener = () => void;

const LISTENERS = new WeakMap<object, Map<string, Set<Listener>>>();
/** Maps reactive proxies → underlying targets so subscribe/set share the same WeakMap key. */
const PROXY_TARGETS = new WeakMap<object, object>();

export type ReactiveDep = { target: object; key: string };

type TrackingFrame = { deps: Map<object, Set<string>> };

let trackingStack: TrackingFrame[] = [];

function resolveTarget(obj: object): object {
  return PROXY_TARGETS.get(obj) ?? obj;
}

function ensureKeyListeners(obj: object, key: string): Set<Listener> {
  const target = resolveTarget(obj);
  let map = LISTENERS.get(target);
  if (!map) {
    map = new Map();
    LISTENERS.set(target, map);
  }
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  return set;
}

function noteRead(target: object, key: string): void {
  const frame = trackingStack[trackingStack.length - 1];
  if (!frame) return;
  let keys = frame.deps.get(target);
  if (!keys) {
    keys = new Set();
    frame.deps.set(target, keys);
  }
  keys.add(key);
}

/**
 * Run `fn` while collecting reactive property reads.
 * Used by `auto()` to subscribe for rebuilds.
 */
export function trackReads(fn: () => void): ReactiveDep[] {
  const frame: TrackingFrame = { deps: new Map() };
  trackingStack.push(frame);
  try {
    fn();
  } finally {
    trackingStack.pop();
  }
  const out: ReactiveDep[] = [];
  for (const [target, keys] of frame.deps) {
    for (const key of keys) out.push({ target, key });
  }
  return out;
}

/** Make a plain object reactive for bindValue / bindTextFrom / auto tracking. */
export function reactive<T extends object>(target: T): T {
  const proxy = new Proxy(target, {
    get(obj, prop, receiver) {
      if (typeof prop === 'string') {
        noteRead(obj, prop);
      }
      return Reflect.get(obj, prop, receiver);
    },
    set(obj, prop, value, receiver) {
      const key = String(prop);
      const prev = Reflect.get(obj, prop, receiver);
      const ok = Reflect.set(obj, prop, value, receiver);
      if (ok && prev !== value) {
        const listeners = LISTENERS.get(obj)?.get(key);
        if (listeners) {
          for (const listener of [...listeners]) listener();
        }
      }
      return ok;
    },
  });
  PROXY_TARGETS.set(proxy, target);
  return proxy;
}

/**
 * Alias for {@link reactive}. Prefer `ui.state` in app code for NiceGUI-ish DX.
 * Mutations notify `subscribe` / `bindValue` / `bindTextFrom` / `auto` dependents.
 */
export function state<T extends object>(initial: T): T {
  return reactive(initial);
}

/** Listen for changes to `obj[key]` on a reactive proxy. Returns an unsubscribe fn. */
export function subscribe(obj: object, key: string, listener: Listener): () => void {
  const set = ensureKeyListeners(obj, key);
  set.add(listener);
  return () => set.delete(listener);
}
