import { Component, type EventHandler, renderToString, jsx, type VNode } from '@badui/core';

export type ButtonColor = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'ghost' | 'link' | 'neutral';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';
export type ButtonVariant = 'default' | 'outline' | 'dashed' | 'soft' | 'ghost';

export type ButtonText = string | (() => string);

export interface ButtonProps {
  text?: ButtonText;
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
    const clickAttr = this.hasEvents()
      ? this.getDataStarPostAction('click')
      : undefined;

    const classes = this.generateClasses() + this.getExtraClasses();
    const style = Object.keys(this._styles).length > 0 ? this._styles as Record<string, string> : undefined;

    const children: (VNode | string | false | null | undefined)[] = [];
    if (this.props.loading) children.push(jsx('span', { class: 'loading loading-spinner' }));
    if (this.props.icon) children.push(jsx('span', { class: this.getIconClasses() }, this.props.icon));
    if (this.props.textExpr) {
      children.push(jsx('span', { 'data-text': this.props.textExpr }));
    } else if (typeof this.props.text === 'function') {
      children.push(this.props.text());
    } else {
      children.push(this.props.text || '');
    }

    return renderToString(
      jsx('button', {
        id: this.id,
        type: this.props.type || 'button',
        class: classes,
        disabled: this.props.disabled || this.props.loading || undefined,
        'data-on:click': clickAttr,
        style,
        title: this._tooltip || undefined,
        children: children.filter(Boolean),
      }),
    );
  }

  private generateClasses(): string {
    const parts = ['btn'];
    if (this.props.color) parts.push(`btn-${this.props.color}`);
    if (this.props.size && this.props.size !== 'md') parts.push(`btn-${this.props.size}`);
    if (this.props.variant) parts.push(`btn-${this.props.variant}`);
    if (this.props.fullWidth) parts.push('w-full');
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
