import { Component } from '@badui/core';

export interface DockItem {
  label: string;
  icon?: string;
  href?: string;
  active?: boolean;
}

export interface DockProps {
  items: DockItem[];
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export class Dock extends Component<DockProps> {
  render(): string {
    const sizeClass = this.props.size ? `dock-${this.props.size}` : '';
    const classes = ['dock', sizeClass, this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');

    const buttons = this.props.items.map((item) => {
      const active = item.active ? 'dock-active' : '';
      const icon = item.icon ? `<span class="dock-label">${item.icon}</span>` : '';
      return `<button class="${active}"><a href="${item.href || '#'}">${icon}<span class="dock-label">${item.label}</span></a></button>`;
    }).join('');

    return `<div id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>${buttons}</div>`;
  }
}

export function dock(items: DockItem[], props?: Omit<DockProps, 'items'>): Dock {
  return new Dock({ items, ...props });
}
