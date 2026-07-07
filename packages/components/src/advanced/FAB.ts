import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from '../layouts/build';

export interface FABProps {
  mainIcon?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

const FAB_KEYS = new Set(['mainIcon', 'position', 'className']);

export class FAB extends Component<FABProps> {
  constructor(props: FABProps = {}) {
    super(props, []);
  }

  render(): string {
    const pos = this.props.position || 'bottom-right';
    const posClass = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'top-right': 'fixed top-6 right-6',
      'top-left': 'fixed top-6 left-6',
    }[pos];

    return `
      <div id="${this.id}" class="${posClass} z-50 flex flex-col gap-2 items-end ${this.props.className || ''}${this.getExtraClasses()}"${this.patchRegionAttr()}${this.getExtraStyles()}>
        <div class="flex flex-col gap-2 mb-2">${this.renderChildren()}</div>
        <button class="btn btn-circle btn-lg btn-primary">${this.props.mainIcon || '+'}</button>
      </div>
    `;
  }
}

export function fab(childrenFn: (f: FAB) => void, props?: FABProps): FAB;
export function fab(...args: (LayoutChild | FABProps)[]): FAB;
export function fab(...args: unknown[]): FAB {
  return buildLayout(FAB, FAB_KEYS, ...args);
}
