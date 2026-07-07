import { Component } from '@badui/core';

export interface ListItem {
  label: string;
  prefix?: string;
}

export interface ListProps {
  items: ListItem[];
  row?: boolean;
  className?: string;
}

export class List extends Component<ListProps> {
  render(): string {
    const classes = ['list', this.props.row ? 'list-row' : '', this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    const items = this.props.items.map((item) => `
      <li class="list-row">
        ${item.prefix ? `<div>${item.prefix}</div>` : ''}
        <div>${item.label}</div>
      </li>
    `).join('');

    return `<ul id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>${items}</ul>`;
  }
}

export function list(items: ListItem[], props?: Omit<ListProps, 'items'>): List {
  return new List({ items, ...props });
}
