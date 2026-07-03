import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from '../layouts/build';

export interface NavbarProps {
  title?: string;
  start?: string;
  end?: string;
  className?: string;
}

const NAVBAR_KEYS = new Set(['title', 'start', 'end', 'className']);

export class Navbar extends Component<NavbarProps> {
  constructor(props: NavbarProps = {}) {
    super(props, []);
  }

  render(): string {
    const classes = ['navbar', 'bg-base-100', 'shadow-sm', this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    return `
      <div id="${this.id}" class="${classes}"${this.getExtraStyles()}>
        <div class="navbar-start">
          ${this.props.start || ''}
          ${this.props.title ? `<a class="btn btn-ghost text-xl">${this.props.title}</a>` : ''}
        </div>
        <div class="navbar-center">${this.renderChildren()}</div>
        <div class="navbar-end">${this.props.end || ''}</div>
      </div>
    `;
  }
}

export function navbar(childrenFn: (n: Navbar) => void, props?: NavbarProps): Navbar;
export function navbar(...args: (LayoutChild | NavbarProps)[]): Navbar;
export function navbar(...args: unknown[]): Navbar {
  return buildLayout(Navbar, NAVBAR_KEYS, ...args);
}
