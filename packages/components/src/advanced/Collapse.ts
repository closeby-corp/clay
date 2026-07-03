import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from '../layouts/build';

export interface CollapseProps {
  title?: string;
  open?: boolean;
  arrow?: boolean;
  className?: string;
}

const COLLAPSE_KEYS = new Set(['title', 'open', 'arrow', 'className']);

export class Collapse extends Component<CollapseProps> {
  constructor(props: CollapseProps = {}) {
    super(props, []);
  }

  render(): string {
    const arrowClass = this.props.arrow !== false ? 'collapse-arrow' : '';
    const classes = ['collapse', arrowClass, 'bg-base-100', 'border', 'border-base-300', this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    return `
      <div id="${this.id}" class="${classes}"${this.getExtraStyles()}>
        <input type="checkbox" ${this.props.open ? 'checked' : ''} />
        ${this.props.title ? `<div class="collapse-title font-semibold">${this.props.title}</div>` : ''}
        <div class="collapse-content">${this.renderChildren()}</div>
      </div>
    `;
  }
}

export function collapse(childrenFn: (c: Collapse) => void, props?: CollapseProps): Collapse;
export function collapse(...args: (LayoutChild | CollapseProps)[]): Collapse;
export function collapse(...args: unknown[]): Collapse {
  return buildLayout(Collapse, COLLAPSE_KEYS, ...args);
}
