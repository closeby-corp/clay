import { Component } from '@ralph/core';

export interface TextAreaProps {
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  rows?: number;
  cols?: number;
  disabled?: boolean;
  required?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  endpoint?: string;
}

export class TextArea extends Component<TextAreaProps> {
  render(): string {
    const htmxAttrs = this.hasEvents() && this.props.endpoint
      ? this.generateEventAttributes(this.props.endpoint)
      : '';

    const textareaClasses = [
      'textarea',
      'textarea-bordered',
      this.props.size && this.props.size !== 'md' ? `textarea-${this.props.size}` : '',
      this.props.fullWidth ? 'w-full' : ''
    ].filter(Boolean).join(' ');

    const resizeStyle = this.props.resize ? `resize: ${this.props.resize};` : '';

    return `
      <div id="${this.id}" class="form-control ${this.props.fullWidth ? 'w-full' : ''}">
        ${this.props.label ? `
          <label class="label">
            <span class="label-text">${this.props.label}</span>
          </label>
        ` : ''}
        <textarea
          name="${this.props.name}"
          rows="${this.props.rows ?? 4}"
          ${this.props.cols ? `cols="${this.props.cols}"` : ''}
          class="${textareaClasses}"
          placeholder="${this.props.placeholder || ''}"
          ${this.props.disabled ? 'disabled' : ''}
          ${this.props.required ? 'required' : ''}
          style="${resizeStyle}"
          ${htmxAttrs}
        >${this.props.value || ''}</textarea>
      </div>
    `;
  }
}

export function textArea(name: string, props?: Omit<TextAreaProps, 'name'>): TextArea {
  return new TextArea({ name, ...props });
}
