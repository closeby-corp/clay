import { Component } from '@badui/core';

export interface LinkProps {
  text: string;
  /** Datastar expression for reactive link text */
  textExpr?: string;
  to: string | (() => void);
  external?: boolean;
  underline?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

export class Link extends Component<LinkProps> {
  render(): string {
    const href = typeof this.props.to === 'string' 
      ? this.props.to 
      : '#';

    const classes = [
      'link',
      this.props.underline ? 'link-underline' : 'link-hover',
      this.props.color ? `link-${this.props.color}` : '',
      this.props.className || ''
    ].filter(Boolean).join(' ');

    const textAttr = this.props.textExpr ? this.signalText(this.props.textExpr) : '';
    const inner = this.props.textExpr ? '' : this.props.text;

    return `
      <a 
        id="${this.id}"
        href="${href}"
        class="${classes}"
        ${this.props.external ? 'target="_blank" rel="noopener noreferrer"' : ''}
        ${textAttr}${this.patchRegionAttr()}${this.getExtraStyles()}
      >
        ${inner}
      </a>
    `;
  }
}

export function link(text: string, to: string | (() => void), props?: Omit<LinkProps, 'text' | 'to'>): Link {
  return new Link({ text, to, ...props });
}
