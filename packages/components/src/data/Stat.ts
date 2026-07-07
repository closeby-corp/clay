import { Component } from '@badui/core';

export interface StatItem {
  title: string;
  value: string;
  desc?: string;
  titleClassName?: string;
  valueClassName?: string;
  descClassName?: string;
}

export interface StatProps {
  items: StatItem[];
  vertical?: boolean;
  className?: string;
}

export class Stat extends Component<StatProps> {
  render(): string {
    const classes = ['stats', 'shadow', this.props.vertical ? 'stats-vertical' : 'stats-horizontal', this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    const items = this.props.items.map((item) => `
      <div class="stat">
        <div class="stat-title ${item.titleClassName || ''}">${item.title}</div>
        <div class="stat-value ${item.valueClassName || ''}">${item.value}</div>
        ${item.desc ? `<div class="stat-desc ${item.descClassName || ''}">${item.desc}</div>` : ''}
      </div>
    `).join('');

    return `<div id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>${items}</div>`;
  }
}

export function stat(items: StatItem[], props?: Omit<StatProps, 'items'>): Stat {
  return new Stat({ items, ...props });
}
