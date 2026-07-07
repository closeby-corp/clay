import { Component } from '@badui/core';

export interface StepItem {
  label: string;
  completed?: boolean;
  active?: boolean;
}

export interface StepsProps {
  items: StepItem[];
  vertical?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

export class Steps extends Component<StepsProps> {
  render(): string {
    const classes = [
      'steps',
      this.props.vertical ? 'steps-vertical' : '',
      this.props.color ? `steps-${this.props.color}` : '',
      this.props.className || '',
      this.getExtraClasses().trim(),
    ].filter(Boolean).join(' ');

    const items = this.props.items.map((item) => {
      const state = item.completed ? 'step-primary' : item.active ? 'step-accent' : '';
      return `<li class="step ${state}">${item.label}</li>`;
    }).join('');

    return `<ul id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>${items}</ul>`;
  }
}

export function steps(items: StepItem[], props?: Omit<StepsProps, 'items'>): Steps {
  return new Steps({ items, ...props });
}
