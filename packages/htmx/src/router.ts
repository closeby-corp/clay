import type { Component } from '@ralph/core';

export interface EventContext {
  componentId: string;
  eventType: string;
  clientId?: string;
  value?: any;
  data?: any;
}

export type EventHandler = (context: EventContext) => string | Promise<string>;

export class EventRouter {
  private handlers: Map<string, Map<string, EventHandler>> = new Map();

  /**
   * Register an event handler for a component
   */
  register(componentId: string, eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(componentId)) {
      this.handlers.set(componentId, new Map());
    }
    this.handlers.get(componentId)!.set(eventType, handler);
  }

  /**
   * Unregister an event handler
   */
  unregister(componentId: string, eventType?: string): void {
    if (eventType) {
      this.handlers.get(componentId)?.delete(eventType);
    } else {
      this.handlers.delete(componentId);
    }
  }

  /**
   * Handle an incoming event request
   */
  async handle(context: EventContext): Promise<string> {
    const componentHandlers = this.handlers.get(context.componentId);
    
    if (!componentHandlers) {
      throw new Error(`No handlers registered for component: ${context.componentId}`);
    }

    const handler = componentHandlers.get(context.eventType);
    
    if (!handler) {
      throw new Error(`No handler for event type '${context.eventType}' on component: ${context.componentId}`);
    }

    return await handler(context);
  }

  /**
   * Check if a component has handlers registered
   */
  hasHandlers(componentId: string): boolean {
    return this.handlers.has(componentId);
  }

  /**
   * Get all handlers for a component
   */
  getHandlers(componentId: string): Map<string, EventHandler> | undefined {
    return this.handlers.get(componentId);
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Global event router instance
export const eventRouter = new EventRouter();
