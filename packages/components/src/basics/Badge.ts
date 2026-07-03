import { Component } from '@badui/core';

export type BadgeColor = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'neutral' | 'ghost';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  text?: string;
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

    return `<span id="${this.id}" class="${classes}"${this.getExtraStyles()}${this.getTooltipAttr()}>${this.props.text || this.renderChildren()}</span>`;
  }
}

export function badge(text?: string, props?: Omit<BadgeProps, 'text'>): Badge {
  return new Badge({ text, ...props });
}
