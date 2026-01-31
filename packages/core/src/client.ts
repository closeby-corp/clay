import { State, type Listener } from './state';
import { GlobalState } from './global-state';

export interface ClientStateOptions<T> {
  initialValue: T;
  persist?: boolean;
  key?: string;
}

export interface ClientSender {
  send(data: string): void;
}

export class Client {
  readonly id: string;
  private sender: ClientSender;
  // Store client-specific state or component instances
  private store: Map<string, any> = new Map();
  // State management
  private states: Map<string, State<any>> = new Map();
  // Component subscriptions for auto-updates
  private componentSubscriptions: Map<string, Set<string>> = new Map();

  constructor(sender: ClientSender) {
    this.id = crypto.randomUUID();
    this.sender = sender;
  }

  /**
   * Send a message to the connected client
   */
  send(message: any) {
    this.sender.send(JSON.stringify(message));
  }

  /**
   * Set a value in the client's isolated state store
   */
  set(key: string, value: any) {
    this.store.set(key, value);
  }

  /**
   * Get a value from the client's isolated state store
   */
  get(key: string): any {
    return this.store.get(key);
  }

  /**
   * Create a reactive state for this client
   */
  createState<T>(key: string, options: ClientStateOptions<T>): State<T> {
    if (this.states.has(key)) {
      return this.states.get(key) as State<T>;
    }

    const state = new State<T>(options.initialValue);
    this.states.set(key, state);

    // Subscribe to changes for potential auto-updates
    state.subscribe((newValue, oldValue) => {
      this.onStateChange(key, newValue, oldValue);
    });

    return state;
  }

  /**
   * Get an existing state
   */
  getState<T>(key: string): State<T> | undefined {
    return this.states.get(key) as State<T> | undefined;
  }

  /**
   * Subscribe a component to a state key
   * When the state changes, the component will be notified
   */
  subscribeComponent(componentId: string, stateKey: string): void {
    if (!this.componentSubscriptions.has(stateKey)) {
      this.componentSubscriptions.set(stateKey, new Set());
    }
    this.componentSubscriptions.get(stateKey)!.add(componentId);
  }

  /**
   * Unsubscribe a component from a state key
   */
  unsubscribeComponent(componentId: string, stateKey?: string): void {
    if (stateKey) {
      this.componentSubscriptions.get(stateKey)?.delete(componentId);
    } else {
      // Unsubscribe from all
      for (const subscribers of this.componentSubscriptions.values()) {
        subscribers.delete(componentId);
      }
    }
  }

  /**
   * Get all components subscribed to a state key
   */
  getSubscribedComponents(stateKey: string): string[] {
    return Array.from(this.componentSubscriptions.get(stateKey) || []);
  }

  /**
   * Handle state change - notify subscribed components
   */
  private onStateChange<T>(key: string, newValue: T, oldValue: T): void {
    const subscribedComponents = this.componentSubscriptions.get(key);
    if (!subscribedComponents || subscribedComponents.size === 0) {
      return;
    }

    // Send update message to client
    this.send({
      type: 'state-change',
      key,
      value: newValue,
      subscribedComponents: Array.from(subscribedComponents)
    });
  }

  /**
   * Subscribe to a global state
   */
  subscribeToGlobal<T>(key: string): State<T> | undefined {
    const state = GlobalState.get<T>(key);
    if (state) {
      GlobalState.subscribe(this, key);
    }
    return state;
  }

  /**
   * Unsubscribe from a global state
   */
  unsubscribeFromGlobal(key?: string): void {
    GlobalState.unsubscribe(this, key);
  }

  /**
   * Handle an incoming message from the client
   */
  handleMessage(message: any) {
    switch (message.type) {
      case 'ping':
        this.send({ type: 'pong', timestamp: Date.now() });
        break;
        
      case 'update':
        if (message.key && message.value !== undefined) {
          this.set(message.key, message.value);
          const state = this.getState(message.key);
          if (state) {
            state.value = message.value;
          }
          this.send({ type: 'ack', id: message.id });
        }
        break;
        
      case 'event':
        // Handle component events
        if (message.componentId && message.eventType) {
          // This will be handled by the event router
          console.log(`[Client ${this.id}] Event:`, message.eventType, 'on', message.componentId);
        }
        break;

      case 'subscribe-global':
        if (message.key) {
          this.subscribeToGlobal(message.key);
        }
        break;

      case 'unsubscribe-global':
        this.unsubscribeFromGlobal(message.key);
        break;
        
      default:
        console.warn(`[Client ${this.id}] Unknown message type:`, message.type);
    }
  }

  /**
   * Clean up on disconnect
   */
  destroy(): void {
    // Unsubscribe from all global states
    this.unsubscribeFromGlobal();
    
    // Clear local state
    this.states.clear();
    this.componentSubscriptions.clear();
    this.store.clear();
  }
}
