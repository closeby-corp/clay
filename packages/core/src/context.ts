import { State } from './state';
import type { Component } from './component';
import { createPageState, type PageState } from './page-state';

export interface RenderContextSender {
  send(data: string): void;
}

export class RenderContext {
  readonly id: string;
  private sender: RenderContextSender;
  private trackedStates: Set<State<any>> = new Set();
  private namedStates: Map<string, State<any>> = new Map();
  private valueComponents: Map<string, any> = new Map();
  private pageInstance: Component | null = null;
  private renderFn: (() => string) | null = null;
  private unsubscribes: (() => void)[] = [];
  private timers: Map<string, Timer> = new Map();

  private pageStateProxy: PageState | null = null;
  private stateIndex = 0;

  // Stable component ID system: generate once, reuse on subsequent renders
  private componentIds: Map<string, string> = new Map();
  private typeCounters: Map<string, number> = new Map();

  constructor(id: string, sender: RenderContextSender) {
    this.id = id;
    this.sender = sender;
  }

  getSender(): RenderContextSender {
    return this.sender;
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

  resetStateIndex(): void {
    this.stateIndex = 0;
  }

  beginRender(): void {
    this.stateIndex = 0;
    this.typeCounters.clear();
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

  /**
   * Sync ValueComponent values from incoming DataStar signals.
   * Called before dispatching event handlers so that handler code
   * reading `valueComponent.get()` gets the latest client-side value.
   */
  syncValueComponentsFromSignals(signals: Record<string, any>): void {
    for (const [name, comp] of this.valueComponents) {
      if (signals[name] !== undefined) {
        try {
          (comp as any)._value = signals[name];
          comp._notifyValueListeners();
        } catch (e) {
          console.error(`[BadUI] Error syncing ValueComponent "${name}":`, e);
        }
      }
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

    queueMicrotask(() => {
      this.updateScheduled = false;
      // Re-rendering is handled within @post() event responses.
      // This method is kept for future SSE push support.
    });
  }

  send(message: any): void {
    this.sender.send(JSON.stringify(message));
  }

  notify(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    options: { duration?: number; position?: string } = {}
  ): void {
    // Toast notifications rendered inline in @post() response
    this.send({
      type: 'toast',
      message,
      toastType: type,
      duration: options.duration ?? 3000,
      position: options.position ?? 'bottom-right'
    });
  }

  runJavascript(code: string): void {
    this.send({ type: 'eval', code });
  }

  navigate(path: string): void {
    this.send({ type: 'navigate', path });
  }

  openDialog(dialogId: string): void {
    this.send({ type: 'modal', action: 'show', modalId: dialogId });
  }

  closeDialog(dialogId: string): void {
    this.send({ type: 'modal', action: 'close', modalId: dialogId });
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
    this.send({ type: 'loading', action: 'show', text: text || 'Loading...' });
  }

  hideLoading(): void {
    this.send({ type: 'loading', action: 'hide' });
  }

  requestRerender(): void {
    this.scheduleUpdate();
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
    this.pageInstance = null;
    this.renderFn = null;
    this.pageStateProxy = null;
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
