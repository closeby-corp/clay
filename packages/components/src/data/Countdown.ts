import { Component } from '@badui/core';

export interface CountdownProps {
  value: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export class Countdown extends Component<CountdownProps> {
  render(): string {
    const sizeClass = this.props.size ? `countdown-${this.props.size}` : '';
    const classes = ['countdown', 'font-mono', sizeClass, this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    return `<span id="${this.id}" class="${classes}" style="--value:${this.props.value};"${this.patchRegionAttr()}${this.getExtraStyles()}></span>`;
  }
}

export function countdown(value: number, props?: Omit<CountdownProps, 'value'>): Countdown {
  return new Countdown({ value, ...props });
}
