import { Component } from '@badui/core';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  indeterminate?: boolean;
  showValue?: boolean;
}

export class Progress extends Component<ProgressProps> {
  render(): string {
    const percentage = this.props.indeterminate
      ? 0
      : Math.min(100, (this.props.value / (this.props.max || 100)) * 100);

    const classes = [
      'progress',
      this.props.size ? `progress-${this.props.size}` : '',
      this.props.color ? `progress-${this.props.color}` : 'progress-primary'
    ].filter(Boolean).join(' ');

    return `
      <div id="${this.id}" class="w-full">
        ${this.props.showValue ? `
          <div class="flex justify-between mb-1">
            <span class="text-sm font-medium">Progress</span>
            <span class="text-sm font-medium">${Math.round(percentage)}%</span>
          </div>
        ` : ''}
        <progress
          class="${classes} w-full"
          value="${this.props.indeterminate ? '' : percentage}"
          max="100"
        ></progress>
      </div>
    `;
  }
}

export function progress(value: number, props?: Omit<ProgressProps, 'value'>): Progress {
  return new Progress({ value, ...props });
}
