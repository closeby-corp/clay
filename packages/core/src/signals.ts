import type { RenderContext } from './context';
import { State } from './state';
import { getCurrentContext } from './context';

/** Event metadata signals — must NOT use `_` prefix (Datastar excludes those from requests). */
export const META_COMP_ID = 'compId';
export const META_EVT_TYPE = 'evtType';
export const META_CTX_ID = 'ctxId';
export const META_DS_VAL_KEY = 'dsValKey';

export const META_SIGNALS = new Set([
  META_COMP_ID,
  META_EVT_TYPE,
  META_CTX_ID,
  META_DS_VAL_KEY,
]);

/** @deprecated Use `_elementDirty: boolean` on RenderContext instead. */
export type DirtyKind = 'none' | 'signals' | 'elements' | 'both';

export function isMetaKey(key: string): boolean {
  return META_SIGNALS.has(key);
}

export function stripMetaSignals(signals: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(signals)) {
    if (!isMetaKey(key)) {
      result[key] = value;
    }
  }
  return result;
}

export function extractMetaSignals(signals: Record<string, unknown>): {
  compId?: string;
  evtType?: string;
  ctxId?: string;
  dsValKey?: string;
} {
  return {
    compId: signals[META_COMP_ID] as string | undefined,
    evtType: signals[META_EVT_TYPE] as string | undefined,
    ctxId: signals[META_CTX_ID] as string | undefined,
    dsValKey: signals[META_DS_VAL_KEY] as string | undefined,
  };
}

/** Legacy keys sent before meta prefix migration. */
export function extractMetaSignalsLegacy(signals: Record<string, unknown>): {
  compId?: string;
  evtType?: string;
  ctxId?: string;
  dsValKey?: string;
} {
  const meta = extractMetaSignals(signals);
  return {
    compId: meta.compId ?? (signals.compId as string | undefined),
    evtType: meta.evtType ?? (signals.evtType as string | undefined),
    ctxId: meta.ctxId ?? (signals.ctxId as string | undefined),
    dsValKey: meta.dsValKey ?? (signals.dsValKey as string | undefined),
  };
}

export function serializeSignals(namedStates: Map<string, State<unknown>>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, state] of namedStates) {
    result[key] = state.value;
  }
  return result;
}

export function applySignalsToContext(
  ctx: RenderContext,
  signals: Record<string, unknown>,
): void {
  const pageSignals = stripMetaSignals(signals);

  for (const [key, value] of Object.entries(pageSignals)) {
    const existing = ctx.getNamedState(key);
    if (existing) {
      existing.value = value;
    } else {
      ctx.setNamedState(key, new State(value));
    }
  }

  ctx.syncValueComponentsFromSignals(pageSignals);
}

export function collectSignalsFromContext(ctx: RenderContext): Record<string, unknown> {
  return serializeSignals(ctx.getNamedStatesMap());
}

/**
 * Typed signal helpers for pages.
 *
 * ```ts
 * const s = defineSignals<{ count: number; name: string }>();
 * const count = s.state('count', 0);  // State<number> ✓
 * const name = s.state('name', '');   // State<string> ✓
 * // s.state('counts', 0);            // Type error ✨
 * ```
 */
export function defineSignals<T extends Record<string, unknown>>() {
  const ctx = getCurrentContext();

  return {
    state<K extends keyof T & string>(
      key: K,
      initialValue: T[K],
    ): State<T[K]> {
      if (ctx) {
        return ctx.getOrCreateState(key, initialValue) as State<T[K]>;
      }
      return new State<T[K]>(initialValue);
    },

    get<K extends keyof T & string>(key: K): T[K] | undefined {
      if (ctx) {
        const state = ctx.getNamedState(key);
        return state?.value as T[K] | undefined;
      }
      return undefined;
    },

    set<K extends keyof T & string>(key: K, value: T[K]): void {
      if (ctx) {
        const state = ctx.getNamedState(key);
        if (state) {
          state.value = value;
        } else {
          ctx.setNamedState(key, new State(value));
        }
      }
    },
  };
}
