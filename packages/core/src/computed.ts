import { State, type Listener } from './state';
import type { Client } from './client';

export interface ComputedOptions {
  immediate?: boolean;
}

/**
 * Create a computed state that automatically updates when its dependencies change
 */
export function computed<T>(
  deps: State<any>[],
  compute: (...values: any[]) => T,
  options: ComputedOptions = {}
): State<T> {
  const initialValue = compute(...deps.map(d => d.value));
  const computedState = new State<T>(initialValue);
  
  // Subscribe to all dependencies
  deps.forEach(dep => {
    dep.subscribe(() => {
      const newValue = compute(...deps.map(d => d.value));
      computedState.value = newValue;
    });
  });
  
  return computedState;
}

/**
 * Create a computed state with a custom equality check
 */
export function computedWithEquality<T>(
  deps: State<any>[],
  compute: (...values: any[]) => T,
  equalityFn: (a: T, b: T) => boolean
): State<T> {
  const initialValue = compute(...deps.map(d => d.value));
  const computedState = new State<T>(initialValue);
  
  deps.forEach(dep => {
    dep.subscribe(() => {
      const newValue = compute(...deps.map(d => d.value));
      if (!equalityFn(computedState.value, newValue)) {
        computedState.value = newValue;
      }
    });
  });
  
  return computedState;
}

/**
 * Watch for changes in states and execute a callback
 */
export function watch(
  deps: State<any>[],
  callback: (...values: any[]) => void,
  options: { immediate?: boolean } = {}
): () => void {
  const unsubs: (() => void)[] = [];
  
  const run = () => {
    callback(...deps.map(d => d.value));
  };
  
  deps.forEach(dep => {
    unsubs.push(dep.subscribe(run));
  });
  
  if (options.immediate) {
    run();
  }
  
  // Return unsubscribe function
  return () => {
    unsubs.forEach(unsub => unsub());
  };
}
