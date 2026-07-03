import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from './build';

export interface DrawerProps {
  id?: string;
  side?: 'left' | 'right';
  open?: boolean;
  className?: string;
}

const DRAWER_KEYS = new Set(['id', 'side', 'open', 'className']);

export class Drawer extends Component<DrawerProps> {
  private _sideContent: (Component | string)[] = [];

  constructor(props: DrawerProps = {}) {
    super(props, []);
  }

  side(child: Component | string): this {
    this._sideContent.push(child);
    return this;
  }

  renderSide(): string {
    return this._sideContent.map((c) => (typeof c === 'string' ? c : c.render())).join('');
  }

  render(): string {
    const drawerId = this.props.id || `${this.id}-toggle`;
    const sideClass = this.props.side === 'right' ? 'drawer-end' : '';
    const classes = ['drawer', sideClass, this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    return `
      <div id="${this.id}" class="${classes}"${this.getExtraStyles()}>
        <input id="${drawerId}" type="checkbox" class="drawer-toggle" ${this.props.open ? 'checked' : ''} />
        <div class="drawer-content">${this.renderChildren()}</div>
        <div class="drawer-side">
          <label for="${drawerId}" class="drawer-overlay"></label>
          <ul class="menu bg-base-200 min-h-full w-80 p-4">${this.renderSide()}</ul>
        </div>
      </div>
    `;
  }
}

export function drawer(childrenFn: (d: Drawer) => void, props?: DrawerProps): Drawer;
export function drawer(...args: (LayoutChild | DrawerProps)[]): Drawer;
export function drawer(...args: unknown[]): Drawer {
  return buildLayout(Drawer, DRAWER_KEYS, ...args);
}
