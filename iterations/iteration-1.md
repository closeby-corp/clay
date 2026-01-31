# Iteration 1: Server Core & Routing

## Goals
- Implement Bun HTTP server
- Add WebSocket support for real-time updates
- Create @page decorator for route registration
- Build per-client state isolation

## Architecture

### Server Structure
```typescript
// packages/server/src/Server.ts
export class Server {
  private clients: Map<string, Client> = new Map();
  private routes: Map<string, PageHandler> = new Map();
  
  constructor(options: ServerOptions) {
    this.setupHTTP();
    this.setupWebSocket();
  }
  
  start(port: number): void
  registerPage(path: string, handler: PageHandler): void
}
```

### @page Decorator
```typescript
// packages/server/src/Router.ts
export function page(path: string, options?: PageOptions) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const server = getGlobalServer();
    server.registerPage(path, descriptor.value);
  };
}

// Usage:
import { page } from '@bad-ui/server';

@page('/')
function home() {
  // Build page here
}
```

### Client Isolation
```typescript
// packages/server/src/Client.ts
export class Client {
  id: string;
  websocket: ServerWebSocket;
  state: Map<string, State<any>> = new Map();
  components: Map<string, Component> = new Map();
  
  constructor(id: string, websocket: ServerWebSocket) {
    this.id = id;
    this.websocket = websocket;
  }
  
  updateComponent(componentId: string, html: string): void {
    this.websocket.send(JSON.stringify({
      type: 'update',
      componentId,
      html
    }));
  }
}
```

## WebSocket Protocol

### Message Types
```typescript
interface WSMessage {
  type: 'update' | 'event' | 'register';
}

interface UpdateMessage extends WSMessage {
  type: 'update';
  componentId: string;
  html: string;
}

interface EventMessage extends WSMessage {
  type: 'event';
  componentId: string;
  eventType: string;
  data?: any;
}

interface RegisterMessage extends WSMessage {
  type: 'register';
  pagePath: string;
}
```

## Implementation

### HTTP Server Setup
```typescript
Bun.serve({
  port: options.port,
  fetch(request: Request) {
    const url = new URL(request.url);
    const route = this.routes.get(url.pathname);
    
    if (route) {
      const client = this.getOrCreateClient(request);
      return route(client);
    }
    
    return new Response('Not Found', { status: 404 });
  },
  websocket: {
    open(ws: ServerWebSocket) {
      const client = new Client(generateId(), ws);
      this.clients.set(client.id, client);
    },
    message(ws: ServerWebSocket, message: string) {
      const data = JSON.parse(message);
      this.handleWebSocketMessage(ws, data);
    },
    close(ws: ServerWebSocket) {
      this.removeClient(ws);
    }
  }
});
```

### HTML Page Template
```typescript
function generatePageHTML(content: string): string {
  return `
<!DOCTYPE html>
<html data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bad UI App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.x/dist/full.min.css" rel="stylesheet">
  <script src="https://unpkg.com/htmx.org@1.9.x"></script>
  <script src="https://unpkg.com/hyperscript.org@0.9.x"></script>
</head>
<body>
  <div id="app">
    ${content}
  </div>
  <script>
    // WebSocket connection
    const ws = new WebSocket('ws://localhost:3000/ws');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update') {
        document.getElementById(data.componentId).outerHTML = data.html;
      }
    };
  </script>
</body>
</html>
  `;
}
```

## Acceptance Criteria
- [ ] Bun HTTP server starts and responds
- [ ] WebSocket connections established
- [ ] @page decorator registers routes
- [ ] Multiple clients have isolated state
- [ ] Server pushes updates to specific clients

## Next Steps
Iteration 2: HTMX integration for server-driven updates
