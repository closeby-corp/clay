import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from '../layouts/build';

export interface MegamenuProps {
  label?: string;
  className?: string;
}

const MEGAMENU_KEYS = new Set(['label', 'className']);

export class Megamenu extends Component<MegamenuProps> {
  constructor(props: MegamenuProps = {}) {
    super(props, []);
  }

  render(): string {
    const classes = ['dropdown', 'dropdown-bottom', this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    return `
      <div id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>
        <div tabindex="0" role="button" class="btn m-1">${this.props.label || 'Menu'}</div>
        <div tabindex="0" class="dropdown-content bg-base-100 rounded-box z-1 w-screen max-w-4xl shadow-lg p-6">
          <div class="grid grid-cols-3 gap-4">${this.renderChildren()}</div>
        </div>
      </div>
    `;
  }
}

export function megamenu(childrenFn: (m: Megamenu) => void, props?: MegamenuProps): Megamenu;
export function megamenu(...args: (LayoutChild | MegamenuProps)[]): Megamenu;
export function megamenu(...args: unknown[]): Megamenu {
  return buildLayout(Megamenu, MEGAMENU_KEYS, ...args);
}
