# Iteration 5: Basic Components

## Goals
- Implement Button component with DaisyUI styling
- Create Label/Text component
- Build Input component
- Implement Container, Row, Column layout components

## Component Design

### DaisyUI Button
```typescript
// packages/components/src/basics/Button.ts
import { Component } from '@bad-ui/core';

export interface ButtonProps {
  text: string;
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'ghost' | 'link' | 'neutral';
  size?: 'lg' | 'md' | 'sm' | 'xs';
  variant?: 'default' | 'outline' | 'dashed' | 'soft';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  onClick?: () => void;
}

export class Button extends Component {
  render(): string {
    const classes = this.generateClasses();
    const htmxAttrs = this.props.onClick 
      ? this.generateHTMXAttrs() 
      : '';
    
    return `
      <button 
        id="${this.id}"
        class="${classes}"
        ${this.props.disabled ? 'disabled' : ''}
        ${htmxAttrs}
      >
        ${this.props.loading ? '<span class="loading loading-spinner"></span>' : ''}
        ${this.props.icon ? `<span class="icon">${this.props.icon}</span>` : ''}
        ${this.props.text}
      </button>
    `;
  }
  
  private generateClasses(): string {
    const parts = ['btn'];
    
    if (this.props.color) parts.push(`btn-${this.props.color}`);
    if (this.props.size && this.props.size !== 'md') parts.push(`btn-${this.props.size}`);
    if (this.props.variant && this.props.variant !== 'default') {
      parts.push(`btn-${this.props.variant}`);
    }
    
    return parts.join(' ');
  }
}
```

### Label Component
```typescript
// packages/components/src/basics/Label.ts
export interface LabelProps {
  text: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;  // DaisyUI color classes
}

export class Label extends Component {
  render(): string {
    const classes = [
      this.props.size ? `text-${this.props.size}` : 'text-base',
      this.props.weight ? `font-${this.props.weight}` : 'font-normal',
      this.props.color
    ].filter(Boolean).join(' ');
    
    return `
      <span id="${this.id}" class="${classes}">
        ${this.props.text}
      </span>
    `;
  }
}
```

### Input Component
```typescript
// packages/components/src/basics/Input.ts
export interface InputProps {
  name: string;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
}

export class Input extends Component {
  render(): string {
    const htmxAttrs = this.generateHTMXAttrs();
    
    return `
      <div id="${this.id}" class="form-control w-full">
        ${this.props.label ? `
          <label class="label">
            <span class="label-text">${this.props.label}</span>
          </label>
        ` : ''}
        <input 
          type="${this.props.type || 'text'}"
          name="${this.props.name}"
          placeholder="${this.props.placeholder || ''}"
          value="${this.props.value || ''}"
          class="input input-bordered w-full ${this.props.error ? 'input-error' : ''}"
          ${this.props.disabled ? 'disabled' : ''}
          ${this.props.required ? 'required' : ''}
          ${htmxAttrs}
        />
        ${this.props.error ? `
          <label class="label">
            <span class="label-text-alt text-error">${this.props.error}</span>
          </label>
        ` : ''}
      </div>
    `;
  }
}
```

### Container Component
```typescript
// packages/components/src/layouts/Container.ts
export interface ContainerProps {
  width?: 'full' | 'max-w-xs' | 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl';
  padding?: 'none' | 'px-2' | 'px-4' | 'px-6' | 'px-8';
  centered?: boolean;
  gap?: '0' | '2' | '4' | '6' | '8';
}

export class Container extends Component {
  render(): string {
    const classes = [
      'w-full',
      this.props.width || 'max-w-7xl',
      this.props.padding || 'px-4',
      this.props.centered ? 'mx-auto' : '',
      this.props.gap ? `space-y-${this.props.gap}` : ''
    ].filter(Boolean).join(' ');
    
    return `
      <div id="${this.id}" class="${classes}">
        ${this.children.map(c => c.render()).join('\n')}
      </div>
    `;
  }
}
```

### Row Component
```typescript
// packages/components/src/layouts/Row.ts
export interface RowProps {
  gap?: '0' | '2' | '4' | '6' | '8';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

export class Row extends Component {
  render(): string {
    const classes = [
      'flex',
      'flex-row',
      this.props.gap ? `gap-${this.props.gap}` : 'gap-4',
      this.props.align ? `items-${this.props.align}` : 'items-center',
      this.props.justify ? `justify-${this.props.justify}` : '',
      this.props.wrap ? 'flex-wrap' : ''
    ].filter(Boolean).join(' ');
    
    return `
      <div id="${this.id}" class="${classes}">
        ${this.children.map(c => c.render()).join('\n')}
      </div>
    `;
  }
}
```

### Column Component
```typescript
// packages/components/src/layouts/Column.ts
export interface ColumnProps {
  gap?: '0' | '2' | '4' | '6' | '8';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export class Column extends Component {
  render(): string {
    const classes = [
      'flex',
      'flex-col',
      this.props.gap ? `gap-${this.props.gap}` : 'gap-4',
      this.props.align ? `items-${this.props.align}` : '',
      this.props.justify ? `justify-${this.props.justify}` : ''
    ].filter(Boolean).join(' ');
    
    return `
      <div id="${this.id}" class="${classes}">
        ${this.children.map(c => c.render()).join('\n')}
      </div>
    `;
  }
}
```

## Convenience Functions

### Functional API (NiceGUI-style)
```typescript
// packages/components/src/index.ts
export function button(text: string, props?: Omit<ButtonProps, 'text'>): Button {
  return new Button({ text, ...props });
}

export function label(text: string, props?: Omit<LabelProps, 'text'>): Label {
  return new Label({ text, ...props });
}

export function input(name: string, props?: Omit<InputProps, 'name'>): Input {
  return new Input({ name, ...props });
}

export function container(children: () => void, props?: ContainerProps): Container {
  const container = new Container(props || {});
  const prevParent = setCurrentParent(container);
  children();
  setCurrentParent(prevParent);
  return container;
}

export function row(children: () => void, props?: RowProps): Row {
  const row = new Row(props || {});
  const prevParent = setCurrentParent(row);
  children();
  setCurrentParent(prevParent);
  return row;
}

export function column(children: () => void, props?: ColumnProps): Column {
  const col = new Column(props || {});
  const prevParent = setCurrentParent(col);
  children();
  setCurrentParent(prevParent);
  return col;
}
```

## Usage Examples

### Counter App
```typescript
@page('/')
function counter() {
  const client = getCurrentClient();
  const count = client.createState('count', { initialValue: 0 });
  
  container(() => {
    label(`Count: ${count.value}`, { size: '2xl' })
      .bind('count');
    
    row(() => {
      button('Decrement', { color: 'error' })
        .onClick(() => count.value--);
      
      button('Increment', { color: 'success' })
        .onClick(() => count.value++);
    });
  });
}
```

### Simple Form
```typescript
@page('/login')
function login() {
  container(() => {
    column(() => {
      input('username', { 
        label: 'Username',
        placeholder: 'Enter username' 
      });
      
      input('password', { 
        type: 'password',
        label: 'Password',
        placeholder: 'Enter password' 
      });
      
      button('Login', { color: 'primary' })
        .onClick(async (client) => {
          const formData = extractFormData();
          await authenticate(formData);
        });
    });
  });
}
```

## Acceptance Criteria
- [ ] Button component with all DaisyUI variants
- [ ] Label with size/weight options
- [ ] Input with validation and HTMX events
- [ ] Container with width/centering options
- [ ] Row and Column layout components
- [ ] Functional API (button(), label(), etc.)
- [ ] All components render valid DaisyUI HTML

## Next Steps
Iteration 6: Form components (Checkbox, Select, Slider, TextArea)
