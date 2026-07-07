import { Component } from '@badui/core';

export type BadgeColor = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'neutral' | 'ghost';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  text?: string;
  /** Datastar expression for reactive text */
  textExpr?: string;
  color?: BadgeColor;
  size?: BadgeSize;
  outline?: boolean;
  className?: string;
}

export class Badge extends Component<BadgeProps> {
  render(): string {
    const classes = [
      'badge',
      this.props.color ? `badge-${this.props.color}` : '',
      this.props.size && this.props.size !== 'md' ? `badge-${this.props.size}` : '',
      this.props.outline ? 'badge-outline' : '',
      this.props.className || '',
      this.getExtraClasses().trim(),
    ].filter(Boolean).join(' ');

    const textAttr = this.props.textExpr ? this.signalText(this.props.textExpr) : '';
    const inner = this.props.textExpr ? '' : (this.props.text || this.renderChildren());

    return `<span id="${this.id}" class="${classes}"${textAttr}${this.patchRegionAttr()}${this.getExtraStyles()}${this.getTooltipAttr()}>${inner}</span>`;
  }
}

export function badge(text?: string | Omit<BadgeProps, 'text'>, props?: Omit<BadgeProps, 'text'>): Badge {
  if (text && typeof text === 'object') {
    return new Badge(text);
  }
  return new Badge({ text: text as string | undefined, ...props });
}
