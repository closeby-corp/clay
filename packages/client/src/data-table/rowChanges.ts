import { useEffect, useRef, useState } from 'react';

type Row = Record<string, unknown>;

const EMPTY: Set<string> = new Set();

/** Stable JSON: object keys sorted at every level, internal "__" fields dropped. */
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value).sort()) {
      if (k.startsWith('__')) continue;
      out[k] = normalize((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

function signature(row: Row): string {
  return JSON.stringify(normalize(row));
}

/** Pure diff: keys whose row is new or whose content changed between two snapshots. */
export function diffRowKeys(
  prev: Map<string, string> | null,
  rows: Record<string, unknown>[],
  keyOf: (row: Record<string, unknown>, index: number) => string,
): { changed: Set<string>; snapshot: Map<string, string> } {
  const snapshot = new Map<string, string>();
  rows.forEach((row, index) => {
    snapshot.set(keyOf(row, index), signature(row));
  });
  const changed = new Set<string>();
  if (prev) {
    for (const [key, sig] of snapshot) {
      if (prev.get(key) !== sig) changed.add(key);
    }
  }
  return { changed, snapshot };
}

/** Keys of rows added/changed by the latest `rows` update, cleared after `durationMs`. */
export function useRowChangeFlash(
  rows: Record<string, unknown>[],
  keyOf: (row: Record<string, unknown>, index: number) => string,
  enabled: boolean,
  durationMs = 1600,
): Set<string> {
  const snapshotRef = useRef<Map<string, string> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flashing, setFlashing] = useState<Set<string>>(EMPTY);

  useEffect(() => {
    if (!enabled) {
      snapshotRef.current = null;
      return;
    }
    const { changed, snapshot } = diffRowKeys(snapshotRef.current, rows, keyOf);
    snapshotRef.current = snapshot;
    if (changed.size === 0) return;

    if (timerRef.current !== null) clearTimeout(timerRef.current);
    setFlashing((active) => new Set([...active, ...changed]));
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setFlashing(EMPTY);
    }, durationMs);
    // keyOf is expected to be a stable/module-level function; rows identity drives the diff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, enabled, durationMs]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  return enabled ? flashing : EMPTY;
}
