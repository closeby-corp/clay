import { useRef, useState } from 'react';

/** Shallow-ish equality so array/object wire props don't loop when only the reference changed. */
export function sameOptimisticValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false;
    }
    return true;
  }
  return false;
}

/**
 * Keep local UI state in sync when the server patches `props`, without blocking on the round-trip.
 *
 * Callers must pass a stable `serverValue` reference across renders when the logical value
 * is unchanged (do not clone/spread on every render — that causes React error #301).
 */
export function useOptimisticValue<T>(serverValue: T): [T, (next: T) => void] {
  const [local, setLocal] = useState(serverValue);
  const prev = useRef(serverValue);
  if (!sameOptimisticValue(prev.current, serverValue)) {
    prev.current = serverValue;
    setLocal(serverValue);
  }
  return [local, setLocal];
}
