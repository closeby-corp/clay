import { Component } from '@ralph/core';
import { htmxString } from '@ralph/htmx';

export type ButtonColor = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'ghost' | 'link' | 'neutral';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';
export type ButtonVariant = 'outline' | 'dashed' | 'soft' | 'ghost';

export interface ButtonProps {
  text: string;
  color?: ButtonColor;
  size?: ButtonSize;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  endpoint?: string; // HTMX endpoint
}

export class Button extends Component<ButtonProps> {
  render(): string {
    const classes = this.generateClasses();
    const htmxAttrs = this.hasEvents() && this.props.endpoint
      ? this.generateEventAttributes(this.props.endpoint)
      : '';
    const disabled = this.props.disabled || this.props.loading ? 'disabled' : '';
    const type = this.props.type || 'button';

    return `
      <button 
        id="${this.id}"
        type="${type}"
        class="${classes}"
        ${disabled}
        ${htmxAttrs}
      >
        ${this.props.loading ? '<span class="loading loading-spinner"></span>' : ''}
        ${this.props.icon ? `<span class="${this.getIconClasses()}">${this.props.icon}</span>` : ''}
        ${this.props.text}
      </button>
    `;
  }

  private generateClasses(): string {
    const parts = ['btn'];

    if (this.props.color) {
      parts.push(`btn-${this.props.color}`);
    }

    if (this.props.size && this.props.size !== 'md') {
      parts.push(`btn-${this.props.size}`);
    }

    if (this.props.variant) {
      parts.push(`btn-${this.props.variant}`);
    }

    if (this.props.fullWidth) {
      parts.push('w-full');
    }

    return parts.join(' ');
  }

  private getIconClasses(): string {
    return this.props.text ? 'mr-2' : '';
  }
}

// Functional API
export function button(text: string, props?: Omit<ButtonProps, 'text'>): Button {
  return new Button({ text, ...props });
}
