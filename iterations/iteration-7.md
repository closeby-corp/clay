# Iteration 7: Layout & Navigation

## Goals
- Implement Tabs component with DaisyUI styling
- Create Card component
- Build Dialog/Modal component with Hyperscript
- Implement Link component for navigation
- Add SPA routing with @page

## Components

### Tabs
```typescript
// packages/components/src/layouts/Tabs.ts
export interface Tab {
  id: string;
  label: string;
  content: Component;
  icon?: string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  variant?: 'bordered' | 'lifted' | 'boxed';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onChange?: (tabId: string) => void;
}

export class Tabs extends Component {
  private activeTab: string;
  
  constructor(props: TabsProps) {
    super(props);
    this.activeTab = props.activeTab || props.tabs[0]?.id || '';
  }
  
  render(): string {
    const variantClass = this.props.variant ? `tabs-${this.props.variant}` : '';
    const sizeClass = this.props.size && this.props.size !== 'md' ? `tabs-${this.props.size}` : '';
    
    return `
      <div id="${this.id}" class="w-full">
        <div class="tabs ${variantClass} ${sizeClass}" role="tablist">
          ${this.props.tabs.map(tab => `
            <button 
              role="tab"
              class="tab ${tab.id === this.activeTab ? 'tab-active' : ''} ${tab.disabled ? 'tab-disabled' : ''}"
              ${!tab.disabled ? `onclick="document.getElementById('${this.id}-content').innerHTML = \`${tab.content.render().replace(/`/g, '\\`')}\`;this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('tab-active'));this.classList.add('tab-active');"` : ''}
            >
              ${tab.icon ? `<span class="icon mr-2">${tab.icon}</span>` : ''}
              ${tab.label}
            </button>
          `).join('')}
        </div>
        <div id="${this.id}-content" class="mt-4">
          ${this.props.tabs.find(t => t.id === this.activeTab)?.content.render() || ''}
        </div>
      </div>
    `;
  }
}

// Usage:
tabs([
  { id: 'general', label: 'General', content: generalSettings() },
  { id: 'security', label: 'Security', content: securitySettings() },
  { id: 'notifications', label: 'Notifications', content: notificationSettings() }
], { variant: 'bordered', activeTab: 'general' });
```

### Card
```typescript
// packages/components/src/layouts/Card.ts
export interface CardProps {
  title?: string;
  subtitle?: string;
  image?: {
    src: string;
    alt?: string;
    position?: 'top' | 'side';
  };
  compact?: boolean;
  bordered?: boolean;
  bgColor?: string;
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export class Card extends Component {
  render(): string {
    const classes = [
      'card',
      this.props.compact ? 'card-compact' : '',
      this.props.bordered ? 'card-bordered' : '',
      this.props.bgColor || 'bg-base-100',
      this.props.shadow ? `shadow-${this.props.shadow}` : 'shadow-xl'
    ].filter(Boolean).join(' ');
    
    const imageSide = this.props.image?.position === 'side';
    
    return `
      <div id="${this.id}" class="${classes} ${imageSide ? 'card-side' : ''}">
        ${this.props.image && !imageSide ? `
          <figure>
            <img src="${this.props.image.src}" alt="${this.props.image.alt || ''}" />
          </figure>
        ` : ''}
        
        <div class="card-body">
          ${this.props.title ? `<h2 class="card-title">${this.props.title}</h2>` : ''}
          ${this.props.subtitle ? `<p class="text-sm opacity-70">${this.props.subtitle}</p>` : ''}
          
          <div class="card-content">
            ${this.children.map(c => c.render()).join('\n')}
          </div>
        </div>
        
        ${this.props.image && imageSide ? `
          <figure>
            <img src="${this.props.image.src}" alt="${this.props.image.alt || ''}" />
          </figure>
        ` : ''}
      </div>
    `;
  }
}

// Usage:
card(() => {
  label('This is the card content');
  row(() => {
    button('Action', { color: 'primary', size: 'sm' });
    button('Cancel', { variant: 'ghost', size: 'sm' });
  });
}, {
  title: 'Card Title',
  subtitle: 'Card subtitle description',
  bordered: true
});
```

### Dialog/Modal
```typescript
// packages/components/src/layouts/Dialog.ts
export interface DialogProps {
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeButton?: boolean;
  backdrop?: boolean;
  onClose?: () => void;
}

export class Dialog extends Component {
  render(): string {
    const modalClass = this.props.size ? `modal-${this.props.size}` : '';
    
    return `
      <dialog id="${this.id}" class="modal ${modalClass}">
        <div class="modal-box">
          ${this.props.closeButton ? `
            <form method="dialog">
              <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
          ` : ''}
          
          ${this.props.title ? `<h3 class="font-bold text-lg mb-4">${this.props.title}</h3>` : ''}
          
          <div class="modal-content">
            ${this.children.map(c => c.render()).join('\n')}
          </div>
        </div>
        
        ${this.props.backdrop !== false ? `
          <form method="dialog" class="modal-backdrop">
            <button>close</button>
          </form>
        ` : ''}
      </dialog>
    `;
  }
  
  // Show method (called server-side, generates HTMX response)
  show(): string {
    return `
      <script>
        document.getElementById('${this.id}').showModal();
      </script>
      ${this.render()}
    `;
  }
  
  close(): string {
    return `
      <script>
        document.getElementById('${this.id}').close();
      </script>
    `;
  }
}

// Usage:
const modal = dialog(() => {
  label('Are you sure you want to delete this item?', { size: 'lg' });
  row(() => {
    button('Cancel', { variant: 'ghost' })
      .onClick((client) => closeDialog(client, modal));
    button('Delete', { color: 'error' })
      .onClick((client) => {
        deleteItem();
        closeDialog(client, modal);
      });
  });
}, { title: 'Confirm Delete', size: 'sm' });

button('Open Modal').onClick((client) => {
  client.sendHTML(modal.show());
});
```

### Link
```typescript
// packages/components/src/navigation/Link.ts
export interface LinkProps {
  text: string;
  to: string | (() => void);
  external?: boolean;
  underline?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'neutral';
  onClick?: () => void;
}

export class Link extends Component {
  render(): string {
    const href = typeof this.props.to === 'string' 
      ? this.props.to 
      : '#';
    
    const classes = [
      'link',
      this.props.underline ? 'link-underline' : 'link-hover',
      this.props.color ? `link-${this.props.color}` : ''
    ].filter(Boolean).join(' ');
    
    const htmxAttrs = typeof this.props.to === 'function' || this.props.onClick
      ? this.generateHTMXAttrs()
      : '';
    
    return `
      <a 
        id="${this.id}"
        href="${href}"
        class="${classes}"
        ${this.props.external ? 'target="_blank" rel="noopener noreferrer"' : ''}
        ${htmxAttrs}
      >
        ${this.props.text}
      </a>
    `;
  }
}

// Usage:
link('Home', '/');
link('External', 'https://example.com', { external: true });
link('Go to Dashboard', () => navigate('/dashboard'));
```

## SPA Routing

### Navigation System
```typescript
// packages/server/src/Navigation.ts
export function navigate(client: Client, path: string): void {
  // Send navigation command to client
  client.websocket.send(JSON.stringify({
    type: 'navigate',
    path: path
  }));
}

// Client-side handler
const navigateScript = `
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'navigate') {
      history.pushState(null, '', msg.path);
      // Trigger page load
      htmx.ajax('GET', msg.path, { target: '#app' });
    }
  };
`;
```

### @page Decorator Enhancement
```typescript
// packages/server/src/Router.ts
interface PageRegistry {
  path: string;
  handler: PageHandler;
  options: PageOptions;
}

export function page(path: string, options: PageOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const server = getGlobalServer();
    
    server.registerPage(path, {
      handler: descriptor.value,
      options: {
        title: options.title,
        layout: options.layout,
        middleware: options.middleware
      }
    });
  };
}

interface PageOptions {
  title?: string;
  layout?: string;
  middleware?: ((client: Client) => boolean)[];
}
```

## Complete SPA Example
```typescript
// App layout
function layout(content: () => void) {
  return container(() => {
    // Navigation
    navbar(() => {
      row(() => {
        link('Home', '/');
        link('About', '/about');
        link('Contact', '/contact');
      });
    });
    
    // Main content
    main(() => {
      content();
    });
  });
}

@page('/', { title: 'Home' })
function homePage() {
  layout(() => {
    container(() => {
      label('Welcome to Bad UI', { size: '4xl', weight: 'bold' });
      label('A NiceGUI-inspired framework for TypeScript');
      
      card(() => {
        label('Get Started');
        button('Learn More', { color: 'primary' })
          .onClick(() => navigate('/about'));
      });
    });
  });
}

@page('/about', { title: 'About' })
function aboutPage() {
  layout(() => {
    container(() => {
      label('About Bad UI', { size: '3xl' });
      
      tabs([
        { 
          id: 'features', 
          label: 'Features', 
          content: column(() => {
            label('Server-driven UI');
            label('WebSocket real-time updates');
            label('HTMX for interactions');
          })
        },
        { 
          id: 'stack', 
          label: 'Stack', 
          content: column(() => {
            label('Bun Runtime');
            label('DaisyUI Components');
            label('TypeScript');
          })
        }
      ]);
    });
  });
}
```

## Convenience Functions
```typescript
export function tabs(tabs: Tab[], props?: Omit<TabsProps, 'tabs'>): Tabs {
  return new Tabs({ tabs, ...props });
}

export function card(children: () => void, props?: CardProps): Card {
  const card = new Card(props || {});
  const prevParent = setCurrentParent(card);
  children();
  setCurrentParent(prevParent);
  return card;
}

export function dialog(children: () => void, props?: DialogProps): Dialog {
  const dialog = new Dialog(props || {});
  const prevParent = setCurrentParent(dialog);
  children();
  setCurrentParent(prevParent);
  return dialog;
}

export function link(text: string, to: string | (() => void), props?: Omit<LinkProps, 'text' | 'to'>): Link {
  return new Link({ text, to, ...props });
}
```

## Acceptance Criteria
- [ ] Tabs with DaisyUI variants
- [ ] Card with image support
- [ ] Dialog/Modal with show/close
- [ ] Link for internal/external navigation
- [ ] SPA routing with @page
- [ ] Navigation between pages
- [ ] Hyperscript for client-side modal handling

## Next Steps
Iteration 8: Advanced components (Table, Toast, Dark Mode)
