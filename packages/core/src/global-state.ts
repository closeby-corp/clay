import { State } from './state';
import { createReactiveState, type ReactiveState } from './reactive';
import type { RenderContext } from './context';
import { getCurrentContext } from './context';

export interface GlobalStateEntry<T> {
  state: State<T>;
  subscribers: Set<RenderContext>;
}

export type GlobalStreamPatcher = (
  ctxId: string,
  patch: { signals: Record<string, unknown> },
) => void;

let streamPatcher: GlobalStreamPatcher | null = null;

export function setGlobalStreamPatcher(patcher: GlobalStreamPatcher | null): void {
  streamPatcher = patcher;
}

/**
 * Global state shared across all connected clients (chat, dashboards, etc.)
 */
export class GlobalState {
  private static states: Map<string, GlobalStateEntry<unknown>> = new Map();

  static create<T>(key: string, initialValue: T): ReactiveState<T> {
    if (this.states.has(key)) {
      return createReactiveState(this.states.get(key)!.state as State<T>);
    }

    const state = new State<T>(initialValue);
    const entry: GlobalStateEntry<T> = {
      state,
      subscribers: new Set(),
    };

    state.subscribe((newValue) => {
      this.broadcast(key, newValue);
    });

    this.states.set(key, entry as GlobalStateEntry<unknown>);

    const ctx = getCurrentContext();
    if (ctx) {
      entry.subscribers.add(ctx);
      ctx.setNamedState(key, state);
    }

    return createReactiveState(state);
  }

  static get<T>(key: string): ReactiveState<T> | undefined {
    const entry = this.states.get(key);
    return entry ? createReactiveState(entry.state as State<T>) : undefined;
  }

  static subscribe(ctx: RenderContext, key: string): void {
    const entry = this.states.get(key);
    if (entry) {
      entry.subscribers.add(ctx);
    }
  }

  static unsubscribe(ctx: RenderContext, key?: string): void {
    if (key) {
      this.states.get(key)?.subscribers.delete(ctx);
    } else {
      for (const entry of this.states.values()) {
        entry.subscribers.delete(ctx);
      }
    }
  }

  private static broadcast<T>(key: string, newValue: T): void {
    const entry = this.states.get(key);
    if (!entry || !streamPatcher) return;

    for (const ctx of entry.subscribers) {
      streamPatcher(ctx.id, { signals: { [key]: newValue } });
    }
  }

  static keys(): string[] {
    return Array.from(this.states.keys());
  }

  static has(key: string): boolean {
    return this.states.has(key);
  }

  static delete(key: string): boolean {
    return this.states.delete(key);
  }

  static clear(): void {
    this.states.clear();
  }

  static subscriberCount(key: string): number {
    return this.states.get(key)?.subscribers.size || 0;
  }
}
