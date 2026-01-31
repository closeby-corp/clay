import { Component } from '@ralph/core';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  name: string;
  label?: string;
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  endpoint?: string;
}

export class Select extends Component<SelectProps> {
  render(): string {
    const htmxAttrs = this.hasEvents() && this.props.endpoint
      ? this.generateEventAttributes(this.props.endpoint)
      : '';

    const selectClasses = [
      'select',
      'select-bordered',
      this.props.size && this.props.size !== 'md' ? `select-${this.props.size}` : '',
      this.props.fullWidth ? 'w-full' : ''
    ].filter(Boolean).join(' ');

    return `
      <div id="${this.id}" class="form-control ${this.props.fullWidth ? 'w-full' : ''}">
        ${this.props.label ? `
          <label class="label">
            <span class="label-text">${this.props.label}</span>
          </label>
        ` : ''}
        <select 
          name="${this.props.name}"
          class="${selectClasses}"
          ${this.props.disabled ? 'disabled' : ''}
          ${htmxAttrs}
        >
          ${this.props.placeholder ? `
            <option disabled ${!this.props.value ? 'selected' : ''}>
              ${this.props.placeholder}
            </option>
          ` : ''}
          ${this.props.options.map(opt => `
            <option 
              value="${opt.value}"
              ${opt.disabled ? 'disabled' : ''}
              ${this.props.value === opt.value ? 'selected' : ''}
            >
              ${opt.label}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }
}

export function select(name: string, options: SelectOption[], props?: Omit<SelectProps, 'name' | 'options'>): Select {
  return new Select({ name, options, ...props });
}
