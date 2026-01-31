import { Component } from '@ralph/core';

export type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'datetime-local' | 'time' | 'file';
export type InputSize = 'xs' | 'sm' | 'md' | 'lg';

export interface InputProps {
  name: string;
  type?: InputType;
  placeholder?: string;
  value?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  size?: InputSize;
  fullWidth?: boolean;
  endpoint?: string; // HTMX endpoint for events
}

export class Input extends Component<InputProps> {
  render(): string {
    const htmxAttrs = this.hasEvents() && this.props.endpoint
      ? this.generateEventAttributes(this.props.endpoint)
      : '';
    
    const inputClasses = this.generateInputClasses();
    const containerClasses = this.props.fullWidth ? 'w-full' : '';

    return `
      <div id="${this.id}" class="form-control ${containerClasses}">
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
          class="${inputClasses}"
          ${this.props.disabled ? 'disabled' : ''}
          ${this.props.required ? 'required' : ''}
          ${htmxAttrs}
        />
        ${this.props.error ? `
          <label class="label">
            <span class="label-text-alt text-error">${this.props.error}</span>
          </label>
        ` : ''}
        ${this.props.hint && !this.props.error ? `
          <label class="label">
            <span class="label-text-alt">${this.props.hint}</span>
          </label>
        ` : ''}
      </div>
    `;
  }

  private generateInputClasses(): string {
    const parts = ['input', 'input-bordered'];

    if (this.props.size && this.props.size !== 'md') {
      parts.push(`input-${this.props.size}`);
    }

    if (this.props.error) {
      parts.push('input-error');
    }

    if (this.props.fullWidth) {
      parts.push('w-full');
    }

    return parts.join(' ');
  }
}

// Functional API
export function input(name: string, props?: Omit<InputProps, 'name'>): Input {
  return new Input({ name, ...props });
}
