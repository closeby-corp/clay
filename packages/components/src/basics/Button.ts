import { Component, type EventHandler } from '@badui/core';

export type ButtonColor = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'ghost' | 'link' | 'neutral';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';
export type ButtonVariant = 'default' | 'outline' | 'dashed' | 'soft' | 'ghost';

export type ButtonText = string | (() => string);

export interface ButtonProps {
  text?: ButtonText;
  /** Datastar expression for reactive button label */
  textExpr?: string;
  color?: ButtonColor;
  size?: ButtonSize;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  on_click?: EventHandler;
}

export class Button extends Component<ButtonProps> {
  constructor(props: ButtonProps = {}) {
    super(props);
    if (props.on_click) {
      this.onClick(props.on_click);
    }
  }

  render(): string {
    const classes = this.generateClasses() + this.getExtraClasses();
    const disabled = this.props.disabled || this.props.loading ? 'disabled' : '';
    const type = this.props.type || 'button';

    const clickAttr = this.hasEvents()
      ? ` data-on:click="${this.getDataStarPostAction('click')}"`
      : '';

    let labelContent: string;
    if (this.props.textExpr) {
      labelContent = `<span${this.signalText(this.props.textExpr)}></span>`;
    } else if (typeof this.props.text === 'function') {
      labelContent = this.props.text();
    } else {
      labelContent = this.props.text || '';
    }

    return `<button id="${this.id}" type="${type}" class="${classes}" ${disabled}${clickAttr}${this.getExtraStyles()}${this.getTooltipAttr()}>${this.props.loading ? '<span class="loading loading-spinner"></span>' : ''}${this.props.icon ? `<span class="${this.getIconClasses()}">${this.props.icon}</span>` : ''}${labelContent}</button>`;
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
    return this.props.text || this.props.textExpr ? 'mr-2' : '';
  }
}

export function button(
  text?: ButtonText | Omit<ButtonProps, 'text'>,
  props?: Omit<ButtonProps, 'text'>,
): Button {
  if (typeof text === 'function') {
    return new Button({ text, ...props });
  }
  if (text && typeof text === 'object') {
    return new Button(text);
  }
  return new Button({ text, ...props });
}
