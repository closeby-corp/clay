import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from '../layouts/build';

export interface DropdownProps {
  label?: string;
  align?: 'start' | 'end' | 'top' | 'bottom';
  hover?: boolean;
  open?: boolean;
  className?: string;
}

const DROPDOWN_KEYS = new Set(['label', 'align', 'hover', 'open', 'className']);

export class Dropdown extends Component<DropdownProps> {
  constructor(props: DropdownProps = {}) {
    super(props, []);
  }

  render(): string {
    const alignClass = this.props.align === 'end' ? 'dropdown-end' : this.props.align === 'top' ? 'dropdown-top' : this.props.align === 'bottom' ? 'dropdown-bottom' : 'dropdown-start';
    const hoverClass = this.props.hover ? 'dropdown-hover' : '';
    const openClass = this.props.open ? 'dropdown-open' : '';
    const classes = ['dropdown', alignClass, hoverClass, openClass, this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    return `
      <div id="${this.id}" class="${classes}" tabindex="0" role="button"${this.patchRegionAttr()}${this.getExtraStyles()}>
        ${this.props.label ? `<div tabindex="0" role="button" class="btn m-1">${this.props.label}</div>` : ''}
        <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
          ${this.renderChildren()}
        </ul>
      </div>
    `;
  }
}

export function dropdown(childrenFn: (d: Dropdown) => void, props?: DropdownProps): Dropdown;
export function dropdown(...args: (LayoutChild | DropdownProps)[]): Dropdown;
export function dropdown(...args: unknown[]): Dropdown {
  return buildLayout(Dropdown, DROPDOWN_KEYS, ...args);
}
