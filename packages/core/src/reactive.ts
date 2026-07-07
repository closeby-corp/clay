import { State, type Listener } from './state';
import type { HasValue } from './component';
import { getCurrentContext } from './context';

const BACKING = Symbol('badui.state.backing');

export interface Reactive<T> {
  get(): T;
  set(value: T): void;
  update(fn: (current: T) => T): void;
  subscribe(listener: Listener<T>): () => void;
  toString(): string;
  [BACKING]?: State<T>;
}

export type ReactiveState<T> = Reactive<T>;

function isMutableArrayMethod(prop: string | symbol): prop is 'push' | 'pop' | 'shift' | 'unshift' | 'splice' | 'sort' | 'reverse' {
  return prop === 'push' || prop === 'pop' || prop === 'shift' || prop === 'unshift'
    || prop === 'splice' || prop === 'sort' || prop === 'reverse';
}

function markStructuralIfNeeded(value: unknown): void {
  if (Array.isArray(value)) {
    getCurrentContext()?.markStructuralDirty();
  }
}

function wrapArrayValue<T extends unknown[]>(backing: State<T>): T {
  return new Proxy(backing.value, {
    get(_target, prop, receiver) {
      const current = backing.value;
      const value = Reflect.get(current, prop, receiver);

      if (typeof value === 'function' && isMutableArrayMethod(prop)) {
        return (...args: unknown[]) => {
          const copy = [...current] as T;
          const method = Reflect.get(copy, prop) as (...a: unknown[]) => unknown;
          const result = method.apply(copy, args);
          backing.value = copy;
          markStructuralIfNeeded(copy);
          return result;
        };
      }

      return value;
    },
    set(_target, prop, newValue) {
      const current = [...backing.value] as T;
      Reflect.set(current, prop, newValue);
      backing.value = current;
      markStructuralIfNeeded(current);
      return true;
    },
  }) as T;
}

function wrapObjectValue<T extends Record<string, unknown>>(backing: State<T>): T {
  return new Proxy(backing.value, {
    get(_target, prop, receiver) {
      return Reflect.get(backing.value, prop, receiver);
    },
    set(_target, prop, newValue) {
      backing.value = { ...backing.value, [prop]: newValue } as T;
      return true;
    },
  }) as T;
}

export function readStateValue<T>(backing: State<T>): T {
  const current = backing.value;

  if (Array.isArray(current)) {
    return wrapArrayValue(backing as State<T & unknown[]>);
  }

  if (current !== null && typeof current === 'object') {
    return wrapObjectValue(backing as State<T & Record<string, unknown>>);
  }

  return current;
}

export function writeStateValue<T>(backing: State<T>, newValue: T): void {
  backing.value = newValue;
  markStructuralIfNeeded(newValue);
}

function numberHelpers<T>(backing: State<T>) {
  return {
    increment(by = 1) {
      const current = backing.value;
      if (typeof current === 'number') {
        writeStateValue(backing, (current + by) as T);
      }
    },
    decrement(by = 1) {
      const current = backing.value;
      if (typeof current === 'number') {
        writeStateValue(backing, (current - by) as T);
      }
    },
  };
}

export function readReactive<T>(source: Reactive<T> | HasValue<T> | State<T>): T {
  if (source instanceof State) return source.value;
  return source.get();
}

/**
 * Wrap a State instance in a Proxy — use get/set/update instead of a value property.
 * Arrays and objects also support direct property access: `items.push(x)`.
 */
export function createReactiveState<T>(backing: State<T>): ReactiveState<T> {
  const helpers = numberHelpers(backing);

  return new Proxy({} as ReactiveState<T>, {
    get(_target, prop) {
      if (prop === BACKING) return backing;

      if (prop === 'get') return () => readStateValue(backing);
      if (prop === 'set') return (value: T) => writeStateValue(backing, value);
      if (prop === 'update') return (fn: (current: T) => T) => writeStateValue(backing, fn(backing.value));
      if (prop === 'subscribe') return backing.subscribe.bind(backing);
      if (prop === 'increment') return helpers.increment;
      if (prop === 'decrement') return helpers.decrement;

      if (prop === Symbol.toPrimitive || prop === 'valueOf') {
        return () => backing.value;
      }

      if (prop === 'toString') {
        return () => String(backing.value);
      }

      const current = backing.value;
      if (current !== null && typeof current === 'object' && (typeof prop === 'string' || typeof prop === 'symbol')) {
        const wrapped = readStateValue(backing) as Record<PropertyKey, unknown>;
        const value = Reflect.get(wrapped, prop, wrapped);
        return typeof value === 'function' ? value.bind(wrapped) : value;
      }

      return undefined;
    },

    set(_target, prop, newValue) {
      const current = backing.value;

      if (Array.isArray(current) && (typeof prop === 'string' || typeof prop === 'number')) {
        const copy = [...current] as T;
        Reflect.set(copy as unknown as object, prop, newValue);
        writeStateValue(backing, copy);
        return true;
      }

      if (current !== null && typeof current === 'object' && typeof prop === 'string') {
        writeStateValue(backing, { ...current, [prop]: newValue } as T);
        return true;
      }

      return false;
    },
  });
}

/** Wrap a ValueComponent so reads/writes use get/set/update. */
export function wrapValueComponent<T, C extends HasValue<T>>(component: C): C {
  return new Proxy(component, {
    get(target, prop, receiver) {
      if (prop === 'get') return () => target.get();
      if (prop === 'set') return (value: T) => target.set(value);
      if (prop === 'update') return (fn: (current: T) => T) => target.set(fn(target.get()));
      if (prop === Symbol.toPrimitive || prop === 'valueOf') {
        return () => target.get();
      }
      if (prop === 'subscribe') return target.subscribe.bind(target);
      if (prop === 'toString') {
        return () => String(target.get());
      }

      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }) as C;
}

export function unwrapState<T>(source: State<T> | ReactiveState<T>): State<T> {
  if (source instanceof State) return source;
  return (source as ReactiveState<T>)[BACKING]!;
}
