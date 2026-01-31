export type Listener<T> = (newValue: T, oldValue: T) => void;

export class State<T> {
  private _value: T;
  private _listeners: Set<Listener<T>> = new Set();

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    if (this._value !== newValue) {
      const oldValue = this._value;
      this._value = newValue;
      this.notify(newValue, oldValue);
    }
  }

  subscribe(listener: Listener<T>): () => void {
    this._listeners.add(listener);
    // Return an unsubscribe function
    return () => {
      this._listeners.delete(listener);
    };
  }

  private notify(newValue: T, oldValue: T): void {
    for (const listener of this._listeners) {
      listener(newValue, oldValue);
    }
  }

  // Helper method to update value (alternative to setter)
  set(newValue: T): void {
    this.value = newValue;
  }

  // Helper method to get value (alternative to getter)
  get(): T {
    return this.value;
  }
}
