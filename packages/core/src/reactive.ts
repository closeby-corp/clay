type Listener = () => void;

const LISTENERS = new WeakMap<object, Map<string, Set<Listener>>>();
/** Maps reactive proxies → underlying targets so subscribe/set share the same WeakMap key. */
const PROXY_TARGETS = new WeakMap<object, object>();

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

/** Make a plain object reactive for bindValue / bindTextFrom. */
export function reactive<T extends object>(target: T): T {
  const proxy = new Proxy(target, {
    get(obj, prop, receiver) {
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

export function subscribe(obj: object, key: string, listener: Listener): () => void {
  const set = ensureKeyListeners(obj, key);
  set.add(listener);
  return () => set.delete(listener);
}
