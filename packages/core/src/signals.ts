import type { RenderContext } from './context';
import { State } from './state';

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

/** Page state keys are stored with this prefix in RenderContext.namedStates. */
export const PAGE_PREFIX = '__page:';

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

function pageKeyToSignal(key: string): string {
  return key.startsWith(PAGE_PREFIX) ? key.slice(PAGE_PREFIX.length) : key;
}

function signalToPageKey(signal: string): string {
  return `${PAGE_PREFIX}${signal}`;
}

export function serializeSignals(namedStates: Map<string, State<unknown>>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, state] of namedStates) {
    if (key.startsWith(PAGE_PREFIX)) {
      result[pageKeyToSignal(key)] = state.value;
    }
  }
  return result;
}

export function applySignalsToContext(
  ctx: RenderContext,
  signals: Record<string, unknown>,
): void {
  const pageSignals = stripMetaSignals(signals);

  for (const [signal, value] of Object.entries(pageSignals)) {
    const pageKey = signalToPageKey(signal);
    const existing = ctx.getNamedState(pageKey);
    if (existing) {
      existing.value = value;
    } else {
      ctx.setNamedState(pageKey, new State(value));
    }
  }

  ctx.syncValueComponentsFromSignals(pageSignals);
}

export function collectSignalsFromContext(ctx: RenderContext): Record<string, unknown> {
  return serializeSignals(ctx.getNamedStatesMap());
}
