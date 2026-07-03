import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from './build';

export interface FooterProps {
  title?: string;
  centered?: boolean;
  className?: string;
}

const FOOTER_KEYS = new Set(['title', 'centered', 'className']);

export class Footer extends Component<FooterProps> {
  constructor(props: FooterProps = {}) {
    super(props, []);
  }

  render(): string {
    const classes = [
      'footer',
      'md:footer-horizontal',
      'p-10',
      'bg-base-200',
      'text-base-content',
      this.props.centered ? 'footer-center' : '',
      this.props.className || '',
      this.getExtraClasses().trim(),
    ].filter(Boolean).join(' ');

    return `
      <footer id="${this.id}" class="${classes}"${this.getExtraStyles()}>
        ${this.props.title ? `<aside><p class="font-bold">${this.props.title}</p></aside>` : ''}
        ${this.renderChildren()}
      </footer>
    `;
  }
}

export function footer(childrenFn: (f: Footer) => void, props?: FooterProps): Footer;
export function footer(...args: (LayoutChild | FooterProps)[]): Footer;
export function footer(...args: unknown[]): Footer {
  return buildLayout(Footer, FOOTER_KEYS, ...args);
}
