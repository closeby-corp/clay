import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from '../layouts/build';

export interface MenuItem {
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
}

export interface MenuProps {
  items?: MenuItem[];
  horizontal?: boolean;
  compact?: boolean;
  className?: string;
}

const MENU_KEYS = new Set(['items', 'horizontal', 'compact', 'className']);

export class Menu extends Component<MenuProps> {
  constructor(props: MenuProps = {}) {
    super(props, []);
  }

  render(): string {
    const classes = [
      'menu',
      this.props.horizontal ? 'menu-horizontal' : 'bg-base-200',
      this.props.compact ? 'menu-compact' : '',
      'rounded-box',
      'w-56',
      this.props.className || '',
      this.getExtraClasses().trim(),
    ].filter(Boolean).join(' ');

    const items = this.props.items?.map((item) => {
      const state = [item.active ? 'menu-active' : '', item.disabled ? 'menu-disabled' : ''].filter(Boolean).join(' ');
      if (item.href) {
        return `<li><a class="${state}" href="${item.href}">${item.label}</a></li>`;
      }
      return `<li class="${state}"><span>${item.label}</span></li>`;
    }).join('') ?? '';

    return `<ul id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>${items}${this.renderChildren()}</ul>`;
  }
}

export function menu(childrenFn: (m: Menu) => void, props?: MenuProps): Menu;
export function menu(...args: (LayoutChild | MenuProps)[]): Menu;
export function menu(...args: unknown[]): Menu {
  return buildLayout(Menu, MENU_KEYS, ...args);
}
