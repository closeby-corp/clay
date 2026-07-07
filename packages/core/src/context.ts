import { State } from './state';
import type { Component } from './component';
import { createPageState, type PageState } from './page-state';
import {
  applySignalsToContext,
  collectSignalsFromContext,
  serializeSignals,
  type DirtyKind,
} from './signals';

export interface SignalPatch {
  signals?: Record<string, unknown>;
  elements?: string;
  selector?: string;
  useViewTransition?: boolean;
}

export type SignalStreamSender = (patch: SignalPatch) => void;

export interface RenderContextSender {
  send(data: string): void;
}

export class RenderContext {
  readonly id: string;
  private sender: RenderContextSender;
  private streamSender: SignalStreamSender | null = null;
  private trackedStates: Set<State<any>> = new Set();
  private namedStates: Map<string, State<any>> = new Map();
  private valueComponents: Map<string, any> = new Map();
  private pageInstance: Component | null = null;
  private renderFn: (() => string) | null = null;
  private unsubscribes: (() => void)[] = [];
  private timers: Map<string, Timer> = new Map();
  private patchRegions: Map<string, string> = new Map();

  private pageStateProxy: PageState | null = null;
  private stateIndex = 0;
  private dirtyKind: DirtyKind = 'none';

  private componentIds: Map<string, string> = new Map();
  private typeCounters: Map<string, number> = new Map();

  constructor(id: string, sender: RenderContextSender) {
    this.id = id;
    this.sender = sender;
  }

  getSender(): RenderContextSender {
    return this.sender;
  }

  setStreamSender(sender: SignalStreamSender | null): void {
    this.streamSender = sender;
  }

  updateSender(sender: RenderContextSender): void {
    this.sender = sender;
  }

  setPage(page: Component, renderFn: () => string): void {
    this.pageInstance = page;
    this.renderFn = renderFn;
  }

  getPage(): Component | null {
    return this.pageInstance;
  }

  getRenderFn(): (() => string) | null {
    return this.renderFn;
  }

  resetStateIndex(): void {
    this.stateIndex = 0;
  }

  beginRender(): void {
    this.stateIndex = 0;
    this.typeCounters.clear();
    this.dirtyKind = 'none';
  }

  getDirtyKind(): DirtyKind {
    return this.dirtyKind;
  }

  markDirty(kind: 'signals' | 'elements'): void {
    if (kind === 'elements') {
      this.dirtyKind = this.dirtyKind === 'signals' ? 'both' : kind;
    } else if (this.dirtyKind === 'none') {
      this.dirtyKind = 'signals';
    } else if (this.dirtyKind === 'elements') {
      this.dirtyKind = 'both';
    }
  }

  registerPatchRegion(regionId: string, selector?: string): void {
    this.patchRegions.set(regionId, selector ?? `#${regionId}`);
  }

  getPatchRegionSelector(regionId: string): string | undefined {
    return this.patchRegions.get(regionId);
  }

  getComponentId(type: string, explicitId?: string, key?: string): string {
    if (explicitId) return explicitId;

    let lookupKey: string;
    if (key) {
      lookupKey = `${type}:key:${key}`;
    } else {
      const index = this.typeCounters.get(type) || 0;
      this.typeCounters.set(type, index + 1);
      lookupKey = `${type}:${index}`;
    }

    if (!this.componentIds.has(lookupKey)) {
      this.componentIds.set(lookupKey, `c-${Math.random().toString(36).substring(2, 11)}`);
    }
    return this.componentIds.get(lookupKey)!;
  }

  getNextStateKey(): string {
    return `__state_${this.stateIndex++}`;
  }

  getOrCreateState<T>(key: string, initialValue: T): State<T> {
    if (this.namedStates.has(key)) {
      return this.namedStates.get(key) as State<T>;
    }

    const newState = new State<T>(initialValue);
    this.namedStates.set(key, newState);
    this.trackState(newState);
    return newState;
  }

  hasNamedState(key: string): boolean {
    return this.namedStates.has(key);
  }

  getNamedState(key: string): State<unknown> | undefined {
    return this.namedStates.get(key);
  }

  getNamedStatesMap(): Map<string, State<unknown>> {
    return this.namedStates;
  }

  setNamedState(key: string, state: State<unknown>): void {
    this.namedStates.set(key, state);
    this.trackState(state);
  }

  getPageState(): PageState {
    if (!this.pageStateProxy) {
      this.pageStateProxy = createPageState(this);
    }
    return this.pageStateProxy;
  }

  getOrCreateValueComponent<C>(name: string, factory: () => C): C {
    if (this.valueComponents.has(name)) {
      return this.valueComponents.get(name) as C;
    }

    const component = factory();
    this.valueComponents.set(name, component);
    return component;
  }

  getValueComponents(): Map<string, unknown> {
    return this.valueComponents;
  }

  syncValueComponentsFromSignals(signals: Record<string, unknown>): void {
    for (const [name, comp] of this.valueComponents) {
      if (signals[name] !== undefined) {
        try {
          (comp as { _value: unknown; _notifyValueListeners(): void })._value = signals[name];
          (comp as { _notifyValueListeners(): void })._notifyValueListeners();
        } catch (e) {
          console.error(`[BadUI] Error syncing ValueComponent "${name}":`, e);
        }
      }
    }
  }

  importSignals(signals: Record<string, unknown>): void {
    applySignalsToContext(this, signals);
  }

  exportSignals(): Record<string, unknown> {
    const signals = collectSignalsFromContext(this);
    for (const [name, comp] of this.valueComponents) {
      signals[name] = (comp as { get(): unknown }).get();
    }
    return signals;
  }

  exportInitialSignals(): Record<string, unknown> {
    return { ctxId: this.id, ...this.exportSignals() };
  }

  pushSignals(signals: Record<string, unknown>): void {
    if (this.streamSender) {
      this.streamSender({ signals });
    }
  }

  trackState<T>(state: State<T>): State<T> {
    if (this.trackedStates.has(state)) {
      return state;
    }

    this.trackedStates.add(state);

    const unsubscribe = state.subscribe(() => {
      this.scheduleUpdate();
    });

    this.unsubscribes.push(unsubscribe);
    return state;
  }

  private updateScheduled = false;
  private _suppressRerender = false;

  suppressRerender(suppress: boolean): void {
    this._suppressRerender = suppress;
  }

  private scheduleUpdate(): void {
    if (this.updateScheduled || this._suppressRerender) return;
    this.updateScheduled = true;
    this.markDirty('signals');

    queueMicrotask(() => {
      this.updateScheduled = false;
      if (this._suppressRerender || !this.streamSender) return;
      this.streamSender({ signals: this.exportSignals() });
    });
  }

  send(message: unknown): void {
    this.sender.send(JSON.stringify(message));
  }

  notify(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    options: { duration?: number; position?: string } = {}
  ): void {
    const duration = options.duration ?? 3000;
    const position = options.position ?? 'bottom-right';
    const posClasses: Record<string, string> = {
      'top-left': 'top-4 left-4',
      'top-center': 'top-4 left-1/2 -translate-x-1/2',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
      'bottom-right': 'bottom-4 right-4',
    };
    const posClass = posClasses[position] ?? posClasses['bottom-right'];
    const toastHtml = `<div class="alert alert-${type} fixed ${posClass} z-50 shadow-lg max-w-sm" id="badui-toast-${Date.now()}"><span>${message}</span></div>`;

    if (this.streamSender) {
      this.streamSender({
        elements: toastHtml,
        selector: 'body',
        useViewTransition: false,
      });
      if (duration > 0) {
        setTimeout(() => {
          this.runJavascript(`document.querySelectorAll('[id^="badui-toast-"]').forEach(el => { if (el.textContent === ${JSON.stringify(message)}) el.remove(); });`);
        }, duration);
      }
    }
  }

  runJavascript(code: string): void {
    if (this.streamSender) {
      this.streamSender({
        elements: `<script>${code}</script>`,
        selector: 'body',
        useViewTransition: false,
      });
    }
  }

  navigate(path: string): void {
    this.runJavascript(`window.location.href = ${JSON.stringify(path)};`);
  }

  openDialog(dialogId: string): void {
    this.runJavascript(`document.getElementById(${JSON.stringify(dialogId)})?.showModal?.();`);
  }

  closeDialog(dialogId: string): void {
    this.runJavascript(`document.getElementById(${JSON.stringify(dialogId)})?.close?.();`);
  }

  timer(callback: () => void, intervalMs: number, options: { immediate?: boolean; once?: boolean } = {}): string {
    const timerId = `timer_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    if (options.immediate) {
      callback();
    }

    if (options.once) {
      const timeoutId = setTimeout(() => {
        callback();
        this.timers.delete(timerId);
      }, intervalMs);
      this.timers.set(timerId, timeoutId as unknown as Timer);
    } else {
      const intervalId = setInterval(() => {
        callback();
      }, intervalMs);
      this.timers.set(timerId, intervalId as unknown as Timer);
    }

    return timerId;
  }

  cancelTimer(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (timer) {
      clearInterval(timer);
      clearTimeout(timer);
      this.timers.delete(timerId);
    }
  }

  cancelAllTimers(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  showLoading(text?: string): void {
    const loadingText = text || 'Loading...';
    const overlay = `<div id="badui-loading-overlay" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"><div class="bg-base-100 rounded-lg p-6 flex flex-col items-center gap-3 shadow-xl"><span class="loading loading-spinner loading-lg text-primary"></span><span class="text-base-content">${loadingText}</span></div></div>`;
    if (this.streamSender) {
      this.streamSender({ elements: overlay, selector: 'body', useViewTransition: false });
    }
  }

  hideLoading(): void {
    this.runJavascript(`document.getElementById('badui-loading-overlay')?.remove();`);
  }

  requestRerender(): void {
    this.markDirty('elements');
    this.scheduleUpdate();
  }

  markStructuralDirty(): void {
    this.markDirty('elements');
  }

  destroy(): void {
    this.cancelAllTimers();
    for (const unsub of this.unsubscribes) {
      unsub();
    }
    this.unsubscribes = [];
    this.trackedStates.clear();
    this.namedStates.clear();
    this.valueComponents.clear();
    this.patchRegions.clear();
    this.pageInstance = null;
    this.renderFn = null;
    this.pageStateProxy = null;
    this.streamSender = null;
  }
}

let currentContext: RenderContext | null = null;

export function setCurrentContext(ctx: RenderContext | null): void {
  currentContext = ctx;
}

export function getCurrentContext(): RenderContext | null {
  return currentContext;
}

export function runWithContext<T>(ctx: RenderContext, fn: () => T): T {
  const prev = currentContext;
  currentContext = ctx;
  try {
    return fn();
  } finally {
    currentContext = prev;
  }
}

export { serializeSignals };
