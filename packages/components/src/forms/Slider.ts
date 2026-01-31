import { Component } from '@ralph/core';

export interface SliderProps {
  name: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  showValue?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  endpoint?: string;
}

export class Slider extends Component<SliderProps> {
  render(): string {
    const htmxAttrs = this.hasEvents() && this.props.endpoint
      ? this.generateEventAttributes(this.props.endpoint)
      : '';

    const value = this.props.value ?? this.props.min ?? 0;
    const rangeClasses = [
      'range',
      this.props.size && this.props.size !== 'md' ? `range-${this.props.size}` : '',
      this.props.color ? `range-${this.props.color}` : ''
    ].filter(Boolean).join(' ');

    return `
      <div id="${this.id}" class="form-control w-full">
        ${this.props.label || this.props.showValue ? `
          <label class="label">
            ${this.props.label ? `<span class="label-text">${this.props.label}</span>` : ''}
            ${this.props.showValue ? `<span class="label-text-alt">${value}</span>` : ''}
          </label>
        ` : ''}
        <input 
          type="range"
          name="${this.props.name}"
          min="${this.props.min ?? 0}"
          max="${this.props.max ?? 100}"
          step="${this.props.step ?? 1}"
          value="${value}"
          class="${rangeClasses}"
          ${this.props.disabled ? 'disabled' : ''}
          ${htmxAttrs}
        />
      </div>
    `;
  }
}

export function slider(name: string, props?: Omit<SliderProps, 'name'>): Slider {
  return new Slider({ name, ...props });
}
