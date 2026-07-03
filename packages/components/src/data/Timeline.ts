import { Component } from '@badui/core';

export interface TimelineItem {
  title: string;
  content?: string;
  icon?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  compact?: boolean;
  className?: string;
}

export class Timeline extends Component<TimelineProps> {
  render(): string {
    const compactClass = this.props.compact ? 'timeline-compact' : '';
    const classes = ['timeline', compactClass, this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');

    const items = this.props.items.map((item, i) => {
      const start = i % 2 === 0 ? 'timeline-start' : 'timeline-end';
      return `
        <li>
          ${item.icon ? `<div class="timeline-middle">${item.icon}</div>` : '<hr />'}
          <div class="${start} timeline-box">${item.title}${item.content ? `<p class="text-sm">${item.content}</p>` : ''}</div>
          <hr />
        </li>
      `;
    }).join('');

    return `<ul id="${this.id}" class="${classes}"${this.getExtraStyles()}>${items}</ul>`;
  }
}

export function timeline(items: TimelineItem[], props?: Omit<TimelineProps, 'items'>): Timeline {
  return new Timeline({ items, ...props });
}
