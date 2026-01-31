# Iteration 3: Event System

## Goals
- Implement onClick, onInput, onChange handlers
- Create event queue for batching
- Handle form submissions
- Support event delegation

## Event Types

### Supported Events
```typescript
export interface EventMap {
  click: MouseEvent;
  input: InputEvent;
  change: Event;
  submit: SubmitEvent;
  focus: FocusEvent;
  blur: FocusEvent;
  keydown: KeyboardEvent;
  keyup: KeyboardEvent;
}
```

### Event Handler Registration
```typescript
// packages/core/src/EventHandler.ts
export class EventHandlerRegistry {
  private handlers: Map<string, Map<string, Function>> = new Map();
  
  register(
    componentId: string, 
    eventType: string, 
    handler: Function
  ): void {
    if (!this.handlers.has(componentId)) {
      this.handlers.set(componentId, new Map());
    }
    this.handlers.get(componentId)!.set(eventType, handler);
  }
  
  async execute(
    componentId: string, 
    eventType: string, 
    client: Client,
    data?: any
  ): Promise<void> {
    const componentHandlers = this.handlers.get(componentId);
    if (!componentHandlers) return;
    
    const handler = componentHandlers.get(eventType);
    if (handler) {
      await handler(client, data);
    }
  }
}
```

## Component Event API

### Fluent Interface
```typescript
// packages/core/src/Component.ts
export abstract class Component {
  protected eventHandlers: Map<string, Function> = new Map();
  
  onClick(handler: (client: Client) => void): this {
    this.eventHandlers.set('click', handler);
    return this;
  }
  
  onInput(handler: (client: Client, value: string) => void): this {
    this.eventHandlers.set('input', handler);
    return this;
  }
  
  onChange(handler: (client: Client, value: any) => void): this {
    this.eventHandlers.set('change', handler);
    return this;
  }
  
  registerEvents(): void {
    this.eventHandlers.forEach((handler, eventType) => {
      eventRegistry.register(this.id, eventType, handler);
    });
  }
}
```

### Usage Example
```typescript
button('Save')
  .onClick(async (client) => {
    await saveData(client.state.get('formData'));
  });

input('username')
  .onInput((client, value) => {
    client.state.get('username').value = value;
  })
  .onChange((client, value) => {
    validateUsername(value);
  });
```

## HTMX Event Triggers

### Generated Attributes
```typescript
function generateEventAttributes(
  component: Component
): string {
  const triggers: string[] = [];
  
  if (component.eventHandlers.has('click')) {
    triggers.push('click');
  }
  
  if (component.eventHandlers.has('input')) {
    triggers.push('input changed delay:300ms');
  }
  
  if (component.eventHandlers.has('change')) {
    triggers.push('change');
  }
  
  if (triggers.length === 0) return '';
  
  return `
    hx-post="/event/${component.id}"
    hx-trigger="${triggers.join(', ')}"
    hx-target="#${component.id}"
    hx-swap="outerHTML"
    hx-vals="js:{value: event.target.value, clientId: '${getClientId()}'}
  `;
}
```

## Event Data Handling

### Request Processing
```typescript
// packages/server/src/EventHandler.ts
export async function handleComponentEvent(
  request: Request
): Promise<Response> {
  const url = new URL(request.url);
  const componentId = extractComponentId(url);
  const body = await request.json();
  
  const client = getClient(body.clientId);
  const component = client.getComponent(componentId);
  const eventType = body.eventType || inferEventType(request);
  
  // Execute handler
  await eventRegistry.execute(componentId, eventType, client, {
    value: body.value,
    originalEvent: body.event
  });
  
  // Re-render and return
  return new Response(component.render(), {
    headers: { 'Content-Type': 'text/html' }
  });
}
```

## Form Handling

### Form Component
```typescript
// packages/components/src/forms/Form.ts
export class Form extends Component {
  onSubmit(handler: (client: Client, data: FormData) => void): this {
    this.eventHandlers.set('submit', async (client: Client) => {
      const formData = extractFormData(this.id);
      await handler(client, formData);
    });
    return this;
  }
  
  render(): string {
    return `
      <form id="${this.id}" 
            class="form-control gap-4"
            ${generateEventAttributes(this)}>
        ${this.children.map(c => c.render()).join('')}
      </form>
    `;
  }
}

// Usage:
form(() => {
  input('username').onInput(...)
  input('password').onInput(...)
  button('Login').onClick(...)
}).onSubmit(async (client, data) => {
  await login(data.get('username'), data.get('password'));
});
```

## Event Batching

### Debouncing
```typescript
export function debounce(
  handler: Function,
  delay: number = 300
): Function {
  let timeoutId: Timer;
  
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => handler(...args), delay);
  };
}

// Usage in onInput:
input('search')
  .onInput(debounce((client, value) => {
    performSearch(value);
  }, 500));
```

## Acceptance Criteria
- [ ] onClick handlers work
- [ ] onInput with debouncing works
- [ ] onChange handlers work
- [ ] Form submission works
- [ ] Event data passed correctly
- [ ] Multiple events per component supported

## Next Steps
Iteration 4: Reactive state management
