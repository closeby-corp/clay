import { Component } from '@badui/core';

export interface CalendarDay {
  day: number;
  disabled?: boolean;
  active?: boolean;
}

export interface CalendarProps {
  month?: string;
  year?: number;
  days?: CalendarDay[];
  className?: string;
}

export class Calendar extends Component<CalendarProps> {
  render(): string {
    const classes = ['calendar', this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');
    const days = this.props.days ?? Array.from({ length: 31 }, (_, i) => ({ day: i + 1 }));

    const dayCells = days.map((d) => {
      const state = [d.disabled ? 'opacity-30' : '', d.active ? 'bg-primary text-primary-content rounded-full' : ''].filter(Boolean).join(' ');
      return `<button class="btn btn-ghost btn-sm ${state}" ${d.disabled ? 'disabled' : ''}>${d.day}</button>`;
    }).join('');

    return `
      <div id="${this.id}" class="${classes}"${this.getExtraStyles()}>
        <div class="flex justify-between items-center mb-2">
          <span class="font-bold">${this.props.month || 'January'} ${this.props.year || new Date().getFullYear()}</span>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-xs opacity-60 mb-1">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>
        <div class="grid grid-cols-7 gap-1">${dayCells}</div>
      </div>
    `;
  }
}

export function calendar(props?: CalendarProps): Calendar {
  return new Calendar(props ?? {});
}
