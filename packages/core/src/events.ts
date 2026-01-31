export type EventHandler = (data?: any) => void | Promise<void>;

export class EventRegistry {
  private handlers: Map<string, Map<string, EventHandler>> = new Map();

  register(componentId: string, eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(componentId)) {
      this.handlers.set(componentId, new Map());
    }
    this.handlers.get(componentId)!.set(eventType, handler);
  }

  unregister(componentId: string, eventType?: string): void {
    if (eventType) {
      this.handlers.get(componentId)?.delete(eventType);
    } else {
      this.handlers.delete(componentId);
    }
  }

  getHandler(componentId: string, eventType: string): EventHandler | undefined {
    return this.handlers.get(componentId)?.get(eventType);
  }

  hasHandler(componentId: string, eventType: string): boolean {
    return this.handlers.get(componentId)?.has(eventType) || false;
  }

  getEvents(componentId: string): string[] {
    const componentHandlers = this.handlers.get(componentId);
    return componentHandlers ? Array.from(componentHandlers.keys()) : [];
  }

  clear(): void {
    this.handlers.clear();
  }
}

// Global event registry
export const eventRegistry = new EventRegistry();
