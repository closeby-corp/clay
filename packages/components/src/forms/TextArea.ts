import { ValueComponent, eventRegistry, getCurrentContext, wrapValueComponent } from '@badui/core';

export interface TextAreaProps {
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
  on_change?: (value: string) => void;
}

export class TextAreaComponent extends ValueComponent<string, TextAreaProps> {
  private _initialized = false;

  constructor(name: string, props: TextAreaProps = {}) {
    const initialValue = props.value ?? '';
    super(name, initialValue, props);
  }

  private _ensureInitialized(): void {
    if (this._initialized) return;
    this._initialized = true;

    if (this.props.on_change) {
      this.onValueChange(this.props.on_change);
    }

    eventRegistry.register(this.id, 'change', (data) => {
      const newValue = data.value ?? '';
      this.set(newValue);
    });
  }

  render(): string {
    this._ensureInitialized();

    const { label, placeholder, rows, cols, disabled, required, resize, size, fullWidth } = this.props;

    const textareaClasses = [
      'textarea',
      size && size !== 'md' ? `textarea-${size}` : '',
      fullWidth ? 'w-full' : ''
    ].filter(Boolean).join(' ');

    const resizeStyle = resize ? `resize: ${resize};` : '';
    const postAction = this.getDataStarPostAction('change', this._name);

    return `
      <fieldset id="${this.id}" class="fieldset ${fullWidth ? 'w-full' : ''}">
        ${label ? `
          <label class="label">
            ${label}
          </label>
        ` : ''}
        <textarea
          rows="${rows ?? 4}"
          ${cols ? `cols="${cols}"` : ''}
          class="${textareaClasses}"
          placeholder="${placeholder || ''}"
          ${disabled ? 'disabled' : ''}
          ${required ? 'required' : ''}
          style="${resizeStyle}"
          data-bind="${this._name}"
          data-on:change="${postAction}"
        >${this._value}</textarea>
      </fieldset>
    `;
  }
}

/**
 * Create a textarea component with reactive get/set binding
 */
export function textArea(name: string, props: TextAreaProps = {}): TextAreaComponent {
  const ctx = getCurrentContext();

  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new TextAreaComponent(name, props)));
  }

  return wrapValueComponent(new TextAreaComponent(name, props));
}
