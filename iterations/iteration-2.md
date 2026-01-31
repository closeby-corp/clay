# Iteration 2: HTMX Integration

## Goals
- Integrate HTMX for server communication
- Implement OOB (Out-of-Band) swaps
- Create client management system
- Handle HTMX events server-side

## Architecture

### HTMX Flow
1. User interacts with element (click, submit)
2. HTMX sends HTTP request to server
3. Server renders component HTML
4. HTMX swaps target element with response
5. WebSocket handles reactive updates outside HTMX requests

### HTMXEngine
```typescript
// packages/htmx/src/HTMXEngine.ts
export class HTMXEngine {
  generateAttributes(
    component: Component,
    event: string,
    swap?: string
  ): string {
    const endpoint = `/event/${component.id}`;
    
    return `
      hx-post="${endpoint}"
      hx-trigger="${event}"
      hx-target="closest .component"
      hx-swap="${swap || 'outerHTML'}"
      hx-vals='{"clientId": "${getCurrentClient().id}"}'
    `;
  }
  
  handleEvent(request: Request): Promise<string> {
    // Parse request, find component, execute handler
    // Return rendered HTML
  }
}
```

### Component Rendering with HTMX
```typescript
// packages/components/src/basics/Button.ts
export class Button extends Component {
  render(): string {
    const htmxAttrs = this.props.onClick 
      ? htmxEngine.generateAttributes(this, 'click')
      : '';
    
    return `
      <button 
        id="${this.id}"
        class="btn btn-primary"
        ${htmxAttrs}
      >
        ${this.props.text}
      </button>
    `;
  }
}
```

## Event Handling

### Event Router
```typescript
// packages/server/src/EventRouter.ts
export class EventRouter {
  private handlers: Map<string, EventHandler> = new Map();
  
  register(componentId: string, handler: EventHandler): void {
    this.handlers.set(componentId, handler);
  }
  
  async handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const componentId = url.pathname.split('/event/')[1];
    const handler = this.handlers.get(componentId);
    
    if (!handler) {
      return new Response('Handler not found', { status: 404 });
    }
    
    const body = await request.json();
    const client = getClient(body.clientId);
    
    // Execute handler
    await handler(client, body);
    
    // Re-render component and return HTML
    const component = client.getComponent(componentId);
    return new Response(component.render(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
```

### Event Handler Types
```typescript
type EventHandler = (client: Client, data: any) => void | Promise<void>;

// Example usage:
const handler: EventHandler = async (client, data) => {
  const counter = client.state.get('counter') as State<number>;
  counter.value++;
};
```

## OOB (Out-of-Band) Updates

### Use Case
When one component updates, other components may need to update too:
```typescript
// Counter increments, label must update too
row(() => {
  label(`Count: ${count.value}`)  // Must update
  button('Increment').onClick(() => count.value++)
})
```

### Implementation
```typescript
export function renderWithOOB(
  primary: Component,
  oobComponents: Component[]
): string {
  const primaryHTML = primary.render();
  const oobHTML = oobComponents.map(c => 
    `<div id="${c.id}" hx-swap-oob="true">${c.render()}</div>`
  ).join('\n');
  
  return `${primaryHTML}\n${oobHTML}`;
}
```

## WebSocket + HTMX Coordination

### Strategy
- **HTMX**: User-triggered actions (clicks, form submits)
- **WebSocket**: Reactive state changes (other users, background updates, timers)

### Client-Side JavaScript
```javascript
// Auto-injected into pages
htmx.on('htmx:afterSwap', (evt) => {
  // Re-initialize any client-side behaviors
  if (window._hyperscript) {
    _hyperscript.processNode(evt.detail.elt);
  }
});

// WebSocket for reactive updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'update') {
    const el = document.getElementById(data.componentId);
    if (el) {
      htmx.swap(el, data.html, {swapStyle: 'outerHTML'});
    }
  }
};
```

## Acceptance Criteria
- [ ] HTMX attributes generated correctly
- [ ] Click events trigger server handlers
- [ ] Components re-render and swap properly
- [ ] OOB updates work for reactive state
- [ ] WebSocket and HTMX don't conflict

## Next Steps
Iteration 3: Event system (onClick, onInput, onChange)
