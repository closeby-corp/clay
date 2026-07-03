import { State } from './state';
import { createReactiveState, type ReactiveState } from './reactive';
import type { Client } from './client';

export interface GlobalStateEntry<T> {
  state: State<T>;
  subscribers: Set<Client>;
}

/**
 * Global state that can be shared across all connected clients
 * Useful for chat rooms, live dashboards, notifications, etc.
 */
export class GlobalState {
  private static states: Map<string, GlobalStateEntry<any>> = new Map();

  /**
   * Create a global state entry
   */
  static create<T>(key: string, initialValue: T): ReactiveState<T> {
    if (this.states.has(key)) {
      return createReactiveState(this.states.get(key)!.state);
    }

    const state = new State<T>(initialValue);
    const entry: GlobalStateEntry<T> = {
      state,
      subscribers: new Set()
    };

    // Subscribe to changes and broadcast to all subscribers
    state.subscribe((newValue, oldValue) => {
      this.broadcast(key, newValue, oldValue);
    });

    this.states.set(key, entry);
    return createReactiveState(state);
  }

  /**
   * Get an existing global state
   */
  static get<T>(key: string): ReactiveState<T> | undefined {
    const entry = this.states.get(key);
    return entry ? createReactiveState(entry.state) : undefined;
  }

  /**
   * Subscribe a client to a global state
   */
  static subscribe<T>(client: Client, key: string): void {
    const entry = this.states.get(key);
    if (entry) {
      entry.subscribers.add(client);
    }
  }

  /**
   * Unsubscribe a client from a global state
   */
  static unsubscribe(client: Client, key?: string): void {
    if (key) {
      this.states.get(key)?.subscribers.delete(client);
    } else {
      // Unsubscribe from all
      for (const entry of this.states.values()) {
        entry.subscribers.delete(client);
      }
    }
  }

  /**
   * Broadcast a state change to all subscribed clients
   */
  private static broadcast<T>(key: string, newValue: T, oldValue: T): void {
    const entry = this.states.get(key);
    if (!entry) return;

    const message = {
      type: 'global-state-update',
      key,
      value: newValue,
      timestamp: Date.now()
    };

    for (const client of entry.subscribers) {
      client.send(message);
    }
  }

  /**
   * Get all global state keys
   */
  static keys(): string[] {
    return Array.from(this.states.keys());
  }

  /**
   * Check if a global state exists
   */
  static has(key: string): boolean {
    return this.states.has(key);
  }

  /**
   * Delete a global state
   */
  static delete(key: string): boolean {
    return this.states.delete(key);
  }

  /**
   * Clear all global states
   */
  static clear(): void {
    this.states.clear();
  }

  /**
   * Get subscriber count for a state
   */
  static subscriberCount(key: string): number {
    return this.states.get(key)?.subscribers.size || 0;
  }
}
