import { eventRegistry, type EventHandler } from './events';
import { generateId } from './utils';
import { getCurrentContext } from './context';

export interface Renderable {
  render(): string;
}

export interface HasValue<T> {
  get(): T;
  set(value: T): void;
  subscribe(listener: (value: T) => void): () => void;
  toString(): string;
}

export abstract class Component<P = any> {
  protected props: P;
  protected children: (Component | string | Renderable)[];
  public id: string;
  protected eventHandlers: Map<string, EventHandler> = new Map();
  protected debouncedHandlers: Map<string, EventHandler> = new Map();
  protected _extraClasses: string[] = [];
  protected _styles: Record<string, string> = {};
  protected _tooltip: string | null = null;

  constructor(props: P = {} as P, children: (Component | string | Renderable)[] = []) {
    this.props = props;
    this.children = children;
    
    // Get stable ID from context, or fall back to random
    const ctx = getCurrentContext();
    const explicitId = (props as any).id;
    const key = (props as any).key;
    const typeName = this.constructor.name;
    
    this.id = ctx 
      ? ctx.getComponentId(typeName, explicitId, key)
      : (explicitId || generateId());
  }

  abstract render(): string;

  protected renderChildren(): string {
    return this.children.map(child => {
      if (typeof child === 'string') return child;
      if ('render' in child && typeof child.render === 'function') {
        return child.render();
      }
      return String(child);
    }).join('');
  }
  
  protected getExtraClasses(): string {
    return this._extraClasses.length > 0 ? ' ' + this._extraClasses.join(' ') : '';
  }
  
  protected getExtraStyles(): string {
    const entries = Object.entries(this._styles);
    if (entries.length === 0) return '';
    return ` style="${entries.map(([k, v]) => `${k}:${v}`).join(';')}"`;
  }
  
  protected getTooltipAttr(): string {
    return this._tooltip ? ` title="${this._tooltip}"` : '';
  }

  /**
   * Add CSS classes (NiceGUI-style method chaining)
   */
  classes(...classNames: string[]): this {
    this._extraClasses.push(...classNames.flatMap(c => c.split(' ')));
    return this;
  }
  
  /**
   * Add inline styles
   */
  style(property: string, value: string): this {
    this._styles[property] = value;
    return this;
  }
  
  /**
   * Add tooltip
   */
  tooltip(text: string): this {
    this._tooltip = text;
    return this;
  }

  /**
   * Add a child component
   */
  add(child: Component | string | Renderable): this {
    this.children.push(child);
    return this;
  }

  /**
   * Register a click event handler
   */
  onClick(handler: EventHandler): this {
    this.eventHandlers.set('click', handler);
    eventRegistry.register(this.id, 'click', handler);
    return this;
  }

  /**
   * Register an input event handler with optional debouncing
   */
  onInput(handler: EventHandler, debounceMs?: number): this {
    let finalHandler = handler;
    
    if (debounceMs && debounceMs > 0) {
      const { debounce } = require('./utils');
      finalHandler = debounce(handler, debounceMs);
      this.debouncedHandlers.set('input', finalHandler);
    }
    
    this.eventHandlers.set('input', finalHandler);
    eventRegistry.register(this.id, 'input', finalHandler);
    return this;
  }

  /**
   * Register a change event handler
   */
  onChange(handler: EventHandler): this {
    this.eventHandlers.set('change', handler);
    eventRegistry.register(this.id, 'change', handler);
    return this;
  }

  /**
   * Register a submit event handler (for forms)
   */
  onSubmit(handler: EventHandler): this {
    this.eventHandlers.set('submit', handler);
    eventRegistry.register(this.id, 'submit', handler);
    return this;
  }

  /**
   * Get all registered event types
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.eventHandlers.keys());
  }

  /**
   * Check if this component has event handlers
   */
  hasEvents(): boolean {
    return this.eventHandlers.size > 0;
  }

  /**
   * Build a DataStar action that assigns event metadata then POSTs.
   * Signals must be set in the handler — static data-signals on siblings
   * collide globally and only the last component's compId survives.
   */
  protected getDataStarPostAction(eventType: string, valKey?: string): string {
    return this.getDataStarPostActionWithSignals(eventType, {}, valKey);
  }

  protected getDataStarPostActionWithSignals(
    eventType: string,
    signals: Record<string, string | number | boolean> = {},
    valKey?: string,
  ): string {
    const ctx = getCurrentContext();
    const assignments = [
      `$compId='${this.id}'`,
      `$evtType='${eventType}'`,
    ];
    if (valKey) {
      assignments.push(`$dsValKey='${valKey}'`);
    }
    for (const [key, value] of Object.entries(signals)) {
      const escaped = String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      assignments.push(`$${key}='${escaped}'`);
    }
    if (ctx) {
      assignments.push(`$ctxId='${ctx.id}'`);
    }
    return `${assignments.join('; ')}; @post('/badui/events')`;
  }

  protected registerEvent(eventType: string, handler: EventHandler): this {
    this.eventHandlers.set(eventType, handler);
    eventRegistry.register(this.id, eventType, handler);
    return this;
  }

  /**
   * Generate DataStar signals JSON for wrapping interactive elements.
   * Returns a JSON string with compId and evtType.
   */
  protected getDataStarSignals(eventType: string, valKey?: string): string {
    const ctx = getCurrentContext();
    const signals: Record<string, any> = {
      compId: this.id,
      evtType: eventType,
    };
    if (valKey) {
      signals.dsValKey = valKey;
    }
    if (ctx) {
      signals.ctxId = ctx.id;
    }
    // Escape single quotes for HTML attribute safety
    return JSON.stringify(signals).replace(/'/g, "&#39;");
  }

  /**
   * Get the first registered event type for this component.
   */
  protected getPrimaryEventType(): string | null {
    if (this.eventHandlers.has('click')) return 'click';
    if (this.eventHandlers.has('change')) return 'change';
    if (this.eventHandlers.has('input')) return 'input';
    if (this.eventHandlers.has('submit')) return 'submit';
    return null;
  }

  /**
   * Clean up event handlers when component is destroyed
   */
  destroy(): void {
    for (const eventType of this.eventHandlers.keys()) {
      eventRegistry.unregister(this.id, eventType);
    }
    this.eventHandlers.clear();
    this.debouncedHandlers.clear();
  }
}

/**
 * Base class for components that hold a value (inputs, sliders, checkboxes, etc.)
 */
export abstract class ValueComponent<T, P = any> extends Component<P> implements HasValue<T> {
  protected _value: T;
  protected _name: string;
  protected _valueListeners: Set<(value: T) => void> = new Set();

  constructor(name: string, initialValue: T, props: P = {} as P) {
    // Use name as the key for stable ID (ValueComponents are keyed by name)
    super({ ...props, key: name } as P);
    this._name = name;
    this._value = initialValue;
  }

  get(): T {
    return this._value;
  }

  set(newValue: T): void {
    if (this._value !== newValue) {
      this._value = newValue;
      this._notifyValueListeners();
      this._triggerRerender();
    }
  }

  update(fn: (current: T) => T): void {
    this.set(fn(this._value));
  }

  get name(): string {
    return this._name;
  }

  /**
   * Subscribe to value changes
   */
  subscribe(listener: (value: T) => void): () => void {
    return this.onValueChange(listener);
  }

  onValueChange(listener: (value: T) => void): () => void {
    this._valueListeners.add(listener);
    return () => this._valueListeners.delete(listener);
  }

  protected _notifyValueListeners(): void {
    for (const listener of this._valueListeners) {
      listener(this._value);
    }
  }

  protected _triggerRerender(): void {
    const ctx = getCurrentContext();
    if (ctx) {
      ctx.requestRerender();
    }
  }

  /**
   * For template strings: `Volume: ${slider}` → "Volume: 50"
   */
  toString(): string {
    return String(this._value);
  }

  /**
   * For JSON.stringify
   */
  toJSON(): T {
    return this._value;
  }

  /**
   * Check if this is a ValueComponent (for label binding)
   */
  static isValueComponent(obj: any): obj is ValueComponent<any> {
    return obj instanceof ValueComponent;
  }
}
