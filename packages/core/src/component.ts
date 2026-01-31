import { eventRegistry, type EventHandler } from './events';
import { generateId } from './utils';

export abstract class Component<P = any> {
  protected props: P;
  protected children: (Component | string)[];
  public id: string;
  protected eventHandlers: Map<string, EventHandler> = new Map();
  protected debouncedHandlers: Map<string, EventHandler> = new Map();

  constructor(props: P = {} as P, children: (Component | string)[] = []) {
    this.props = props;
    this.children = children;
    this.id = (props as any).id || generateId();
  }

  abstract render(): string;

  protected renderChildren(): string {
    return this.children.map(child => {
      if (typeof child === 'string') return child;
      return child.render();
    }).join('');
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
   * Generate HTMX event attributes for this component
   */
  generateEventAttributes(endpoint: string): string {
    if (!this.hasEvents()) {
      return '';
    }

    const triggers: string[] = [];
    
    for (const [eventType] of this.eventHandlers) {
      switch (eventType) {
        case 'click':
          triggers.push('click');
          break;
        case 'input':
          const hasDebounce = this.debouncedHandlers.has('input');
          triggers.push(hasDebounce ? 'input changed delay:300ms' : 'input');
          break;
        case 'change':
          triggers.push('change');
          break;
        case 'submit':
          triggers.push('submit');
          break;
      }
    }

    if (triggers.length === 0) {
      return '';
    }

    return `hx-post="${endpoint}" hx-trigger="${triggers.join(', ')}" hx-target="#${this.id}" hx-swap="outerHTML"`;
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
