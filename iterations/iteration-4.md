# Iteration 4: Reactive State Management

## Goals
- Implement server-side reactive state
- Auto-sync state changes to UI
- Support computed values
- Handle state persistence per client

## State Architecture

### State Types
```typescript
// packages/core/src/State.ts
export interface StateOptions<T> {
  initialValue: T;
  persist?: boolean;  // Persist across page reloads
  debounce?: number;  // Debounce UI updates
}

export class State<T> {
  private _value: T;
  private subscribers: Set<(newValue: T, oldValue: T) => void> = new Set();
  private options: StateOptions<T>;
  private client: Client;
  
  constructor(client: Client, options: StateOptions<T>) {
    this.client = client;
    this.options = options;
    this._value = options.initialValue;
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
  
  subscribe(callback: (newValue: T, oldValue: T) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  private notify(newValue: T, oldValue: T): void {
    this.subscribers.forEach(cb => cb(newValue, oldValue));
  }
}
```

### Computed State
```typescript
export function computed<T>(
  client: Client,
  deps: State<any>[],
  compute: (...values: any[]) => T
): State<T> {
  const initialValue = compute(...deps.map(d => d.value));
  const state = client.createState({ initialValue });
  
  deps.forEach(dep => {
    dep.subscribe(() => {
      state.value = compute(...deps.map(d => d.value));
    });
  });
  
  return state;
}
```

## Client State Management

### Client State Store
```typescript
// packages/server/src/Client.ts
export class Client {
  id: string;
  private states: Map<string, State<any>> = new Map();
  private componentSubscriptions: Map<string, Set<string>> = new Map();
  
  createState<T>(key: string, options: StateOptions<T>): State<T> {
    if (this.states.has(key)) {
      return this.states.get(key) as State<T>;
    }
    
    const state = new State(this, options);
    this.states.set(key, state);
    
    // Subscribe to state changes for UI updates
    state.subscribe((newVal, oldVal) => {
      this.onStateChange(key, newVal, oldVal);
    });
    
    return state;
  }
  
  getState<T>(key: string): State<T> | undefined {
    return this.states.get(key) as State<T>;
  }
  
  private onStateChange(key: string, newValue: any, oldValue: any): void {
    // Find all components subscribed to this state
    const subscribedComponents = this.componentSubscriptions.get(key);
    if (!subscribedComponents) return;
    
    // Update each component
    subscribedComponents.forEach(componentId => {
      const component = this.getComponent(componentId);
      if (component) {
        this.updateComponent(component);
      }
    });
  }
}
```

## Component State Binding

### Bind Method
```typescript
// packages/core/src/Component.ts
export abstract class Component {
  protected boundStates: Set<string> = new Set();
  
  bind(stateKey: string): this {
    this.boundStates.add(stateKey);
    const client = getCurrentClient();
    
    // Register component for state updates
    if (!client.componentSubscriptions.has(stateKey)) {
      client.componentSubscriptions.set(stateKey, new Set());
    }
    client.componentSubscriptions.get(stateKey)!.add(this.id);
    
    return this;
  }
}
```

### Usage Example
```typescript
@page('/')
function counterPage() {
  const client = getCurrentClient();
  const count = client.createState('count', { initialValue: 0 });
  
  container(() => {
    label(`Count: ${count.value}`)
      .bind('count');  // Auto-updates when count changes
    
    button('Increment')
      .onClick(() => {
        count.value++;
      });
  });
}
```

## UI Auto-Update

### WebSocket Push
```typescript
// packages/server/src/Client.ts
async updateComponent(component: Component): Promise<void> {
  const html = component.render();
  
  // Send via WebSocket for real-time updates
  this.websocket.send(JSON.stringify({
    type: 'update',
    componentId: component.id,
    html: html,
    timestamp: Date.now()
  }));
}
```

### Client-Side Handler
```javascript
// Injected into each page
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === 'update') {
    const element = document.getElementById(msg.componentId);
    if (element) {
      // Use HTMX for smooth swapping
      htmx.swap(element, msg.html, {
        swapStyle: 'outerHTML',
        transition: true
      });
    }
  }
};
```

## Global State (Shared)

### Use Case: Chat, Live Dashboard
```typescript
// packages/server/src/GlobalState.ts
export class GlobalState {
  private static states: Map<string, State<any>> = new Map();
  private static subscribers: Map<string, Set<Client>> = new Map();
  
  static create<T>(key: string, initialValue: T): State<T> {
    const state = new State(null as any, { initialValue });
    this.states.set(key, state);
    
    state.subscribe((newVal) => {
      this.broadcast(key, newVal);
    });
    
    return state;
  }
  
  static subscribe(client: Client, key: string): void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(client);
  }
  
  private static broadcast(key: string, value: any): void {
    const clients = this.subscribers.get(key);
    if (!clients) return;
    
    clients.forEach(client => {
      // Update all components bound to this state
      // across all connected clients
    });
  }
}
```

## State Persistence

### Session Storage
```typescript
export function persistToSession<T>(state: State<T>, key: string): void {
  // Save to Redis/SQLite/memory on change
  state.subscribe((newValue) => {
    sessionStorage.set(`${key}:${state.client.id}`, JSON.stringify(newValue));
  });
  
  // Restore on client reconnect
  const saved = sessionStorage.get(`${key}:${state.client.id}`);
  if (saved) {
    state.value = JSON.parse(saved);
  }
}
```

## Acceptance Criteria
- [ ] State changes trigger UI updates
- [ ] Multiple components can bind to same state
- [ ] Computed values update automatically
- [ ] WebSocket pushes updates to clients
- [ ] Global state works across clients
- [ ] State persists for client session

## Next Steps
Iteration 5: Basic components (Button, Label, Input, Container)
