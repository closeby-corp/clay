# Iteration 0: Foundation & Project Structure

## Goals
- Set up Bun monorepo with workspaces
- Create core Component base class
- Establish reactive state primitives
- Define HTMX HTML generation engine

## Architecture Decisions

### Monorepo Structure
```
bad-ui/
├── packages/
│   ├── core/              # Component base, State, HTMX engine
│   │   ├── src/
│   │   │   ├── Component.ts
│   │   │   ├── State.ts
│   │   │   ├── HTMXEngine.ts
│   │   │   └── index.ts
│   │   └── package.json
│   ├── server/            # Bun HTTP + WebSocket server
│   │   ├── src/
│   │   │   ├── Server.ts
│   │   │   ├── Router.ts
│   │   │   ├── Client.ts
│   │   │   └── index.ts
│   │   └── package.json
│   ├── components/        # DaisyUI components
│   │   ├── src/
│   │   │   ├── basics/
│   │   │   ├── forms/
│   │   │   └── index.ts
│   │   └── package.json
│   └── htmx/              # HTMX integration layer
│       ├── src/
│       │   └── index.ts
│       └── package.json
├── apps/
│   └── demo/
│       ├── src/
│       │   └── main.ts
│       └── package.json
├── package.json           # Root with Bun workspaces
└── tsconfig.json
```

### Technology Choices
- **Runtime**: Bun (fast, TypeScript native)
- **HTTP/WebSocket**: Bun.serve() native
- **Styling**: DaisyUI + TailwindCSS (via CDN for simplicity)
- **Client behaviors**: Hyperscript (for modals, dropdowns)
- **State**: Server-side reactive (computed, state)

## Implementation Details

### 1. Root Package Configuration
```json
// package.json
{
  "name": "bad-ui",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/bun": "latest"
  }
}
```

### 2. Core Package - Component Base
```typescript
// packages/core/src/Component.ts
export abstract class Component {
  protected children: Component[] = [];
  protected props: Record<string, any> = {};
  protected _id: string;
  
  constructor(props: Record<string, any> = {}) {
    this._id = generateId();
    this.props = props;
  }
  
  abstract render(): string;
  
  get id(): string {
    return this._id;
  }
  
  add(child: Component): this {
    this.children.push(child);
    return this;
  }
}
```

### 3. Core Package - Reactive State
```typescript
// packages/core/src/State.ts
type Listener = () => void;

export class State<T> {
  private _value: T;
  private listeners: Set<Listener> = new Set();
  
  constructor(initialValue: T) {
    this._value = initialValue;
  }
  
  get value(): T {
    return this._value;
  }
  
  set value(newValue: T) {
    if (this._value !== newValue) {
      this._value = newValue;
      this.notify();
    }
  }
  
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notify(): void {
    this.listeners.forEach(l => l());
  }
}

export function state<T>(initialValue: T): State<T> {
  return new State(initialValue);
}
```

### 4. Core Package - HTMX Engine
```typescript
// packages/core/src/HTMXEngine.ts
export interface HTMXAttributes {
  'hx-post'?: string;
  'hx-get'?: string;
  'hx-target'?: string;
  'hx-swap'?: string;
  'hx-trigger'?: string;
  'hx-vals'?: string;
}

export function generateHTMXAttributes(
  endpoint: string,
  method: 'get' | 'post' = 'post',
  target?: string,
  swap: string = 'outerHTML'
): string {
  const attrs: string[] = [
    `${method === 'post' ? 'hx-post' : 'hx-get'}="${endpoint}"`,
    `hx-swap="${swap}"`
  ];
  
  if (target) {
    attrs.push(`hx-target="${target}"`);
  }
  
  return attrs.join(' ');
}
```

## Package Dependencies
```
core: (no dependencies)
server: depends on core
components: depends on core, htmx
htmx: depends on core
demo: depends on core, server, components, htmx
```

## Usage Example (Target API)
```typescript
import { state, Component } from '@bad-ui/core';
import { Button, Label } from '@bad-ui/components';

const count = state(0);

class Counter extends Component {
  render() {
    return `
      <div>
        ${new Label({ text: `Count: ${count.value}` }).render()}
        ${new Button({ 
          text: 'Increment',
          onClick: () => count.value++
        }).render()}
      </div>
    `;
  }
}
```

## Acceptance Criteria
- [ ] Bun workspaces configured and working
- [ ] All packages build without errors
- [ ] Component base class implemented
- [ ] State reactive system working
- [ ] HTMX attribute generator functional
- [ ] Inter-package imports working

## Next Steps
- Iteration 1: Bun HTTP server with WebSocket support
