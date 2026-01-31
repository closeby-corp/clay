import { Component } from '@ralph/core';

export interface CheckboxProps {
  name: string;
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  endpoint?: string;
}

export class Checkbox extends Component<CheckboxProps> {
  render(): string {
    const htmxAttrs = this.hasEvents() && this.props.endpoint
      ? this.generateEventAttributes(this.props.endpoint)
      : '';

    return `
      <div id="${this.id}" class="form-control">
        <label class="label cursor-pointer justify-start gap-4">
          <input 
            type="checkbox"
            name="${this.props.name}"
            class="checkbox ${this.props.indeterminate ? 'checkbox-indeterminate' : ''}"
            ${this.props.checked ? 'checked' : ''}
            ${this.props.disabled ? 'disabled' : ''}
            ${htmxAttrs}
          />
          ${this.props.label ? `<span class="label-text">${this.props.label}</span>` : ''}
        </label>
      </div>
    `;
  }
}

export function checkbox(name: string, props?: Omit<CheckboxProps, 'name'>): Checkbox {
  return new Checkbox({ name, ...props });
}
