import { State } from './state';
import { createReactiveState, readReactive, type ReactiveState } from './reactive';
import type { HasValue } from './component';

export interface ComputedOptions {
  immediate?: boolean;
}

/**
 * Create a computed state that automatically updates when its dependencies change
 */
type ReactiveDep = State<any> | ReactiveState<any> | HasValue<any>;

export function computed<T>(
  deps: ReactiveDep[],
  compute: (...values: any[]) => T,
  options: ComputedOptions = {}
): ReactiveState<T> {
  const initialValue = compute(...deps.map(readReactive));
  const computedState = new State<T>(initialValue);

  deps.forEach(dep => {
    dep.subscribe(() => {
      computedState.set(compute(...deps.map(readReactive)));
    });
  });

  return createReactiveState(computedState);
}

/**
 * Create a computed state with a custom equality check
 */
export function computedWithEquality<T>(
  deps: ReactiveDep[],
  compute: (...values: any[]) => T,
  equalityFn: (a: T, b: T) => boolean
): ReactiveState<T> {
  const initialValue = compute(...deps.map(readReactive));
  const computedState = new State<T>(initialValue);

  deps.forEach(dep => {
    dep.subscribe(() => {
      const newValue = compute(...deps.map(readReactive));
      if (!equalityFn(computedState.get(), newValue)) {
        computedState.set(newValue);
      }
    });
  });

  return createReactiveState(computedState);
}

/**
 * Watch for changes in states and execute a callback
 */
export function watch(
  deps: ReactiveDep[],
  callback: (...values: any[]) => void,
  options: { immediate?: boolean } = {}
): () => void {
  const unsubs: (() => void)[] = [];

  const run = () => {
    callback(...deps.map(readReactive));
  };

  deps.forEach(dep => {
    unsubs.push(dep.subscribe(run));
  });

  if (options.immediate) {
    run();
  }

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}
