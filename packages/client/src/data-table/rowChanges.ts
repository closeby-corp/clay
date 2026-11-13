import { useEffect, useRef, useState } from 'react';

type Row = Record<string, unknown>;

type Flash = { expiresAt: number; gen: 0 | 1 };
const EMPTY: Map<string, Flash> = new Map();

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

/** Per-row expiry and alternating classes let repeated changes restart the animation. */
export function useRowChangeFlash(
  rows: Record<string, unknown>[],
  keyOf: (row: Record<string, unknown>, index: number) => string,
  enabled: boolean,
  durationMs = 1600,
): (key: string) => string | undefined {
  const snapshotRef = useRef<Map<string, string> | null>(null);
  const [flashing, setFlashing] = useState<Map<string, Flash>>(EMPTY);

  useEffect(() => {
    if (!enabled) {
      snapshotRef.current = null;
      setFlashing(EMPTY);
      return;
    }
    const { changed, snapshot } = diffRowKeys(snapshotRef.current, rows, keyOf);
    snapshotRef.current = snapshot;
    if (changed.size === 0) return;

    const now = Date.now();
    setFlashing((active) => {
      const next = new Map(active);
      for (const key of changed) {
        next.set(key, {
          expiresAt: now + durationMs,
          gen: active.get(key)?.gen === 0 ? 1 : 0,
        });
      }
      return next;
    });
    // keyOf is expected to be a stable/module-level function; rows identity drives the diff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, enabled, durationMs]);

  useEffect(() => {
    if (!enabled || flashing.size === 0) return;
    let earliest = Infinity;
    for (const flash of flashing.values()) earliest = Math.min(earliest, flash.expiresAt);
    const timer = setTimeout(() => {
      const now = Date.now();
      setFlashing((active) => new Map(
        [...active].filter(([, flash]) => flash.expiresAt > now),
      ));
    }, Math.max(0, earliest - Date.now()));
    return () => clearTimeout(timer);
  }, [flashing, enabled]);

  return (key) => {
    const flash = enabled ? flashing.get(key) : undefined;
    return flash ? `clay-row-flash-${flash.gen === 0 ? 'a' : 'b'}` : undefined;
  };
}
