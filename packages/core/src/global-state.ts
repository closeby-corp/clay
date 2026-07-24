type Listener<T> = (value: T) => void;

const stores = new Map<string, GlobalState<unknown>>();

export class GlobalState<T> {
  private value: T;
  private listeners = new Set<Listener<T>>();

  private constructor(initial: T) {
    this.value = initial;
  }

  static create<T>(key: string, initial: T): GlobalState<T> {
    const existing = stores.get(key) as GlobalState<T> | undefined;
    if (existing) return existing;
    const state = new GlobalState(initial);
    stores.set(key, state as GlobalState<unknown>);
    return state;
  }

  static clearAll(): void {
    stores.clear();
  }

  get(): T {
    return this.value;
  }

  set(value: T): void {
    this.value = value;
    for (const listener of [...this.listeners]) {
      listener(value);
    }
  }

  update(fn: (prev: T) => T): void {
    this.set(fn(this.value));
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
