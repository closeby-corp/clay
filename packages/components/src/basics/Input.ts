import { ValueComponent, eventRegistry, getCurrentContext, wrapValueComponent } from '@badui/core';

export type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'datetime-local' | 'time' | 'file';
export type InputSize = 'xs' | 'sm' | 'md' | 'lg';

export interface InputProps {
  type?: InputType;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  size?: InputSize;
  fullWidth?: boolean;
  value?: string;
  on_change?: (value: string) => void;
  on_input?: (value: string) => void;
  debounce?: number;
}

export class InputComponent extends ValueComponent<string, InputProps> {
  private _initialized = false;

  constructor(name: string, props: InputProps = {}) {
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

    if (this.props.on_input) {
      eventRegistry.register(this.id, 'input', (data) => {
        const newValue = data.value ?? '';
        this._value = newValue;
        this.props.on_input!(newValue);
      });
    }
  }

  render(): string {
    this._ensureInitialized();

    const { type = 'text', placeholder = '', label, error, hint, disabled, required, size, fullWidth } = this.props;

    const inputClasses = [
      'input',
      size && size !== 'md' ? `input-${size}` : '',
      error ? 'input-error' : '',
      fullWidth ? 'w-full' : ''
    ].filter(Boolean).join(' ');

    const eventType = this.props.on_input ? 'input' : 'change';
    const postAction = this.getDataStarPostAction(eventType, this._name);

    return `
      <fieldset id="${this.id}" class="fieldset ${fullWidth ? 'w-full' : ''}">
        ${label ? `
          <label class="label">
            ${label}
          </label>
        ` : ''}
        <input 
          type="${type}"
          placeholder="${placeholder}"
          value="${this._value}"
          class="${inputClasses}"
          ${disabled ? 'disabled' : ''}
          ${required ? 'required' : ''}
          data-bind="${this._name}"
          data-on:${eventType}="${postAction}"
        />
        ${error ? `
          <label class="label">
            <span class="text-sm text-error">${error}</span>
          </label>
        ` : ''}
        ${hint && !error ? `
          <label class="label">
            <span class="text-sm opacity-70">${hint}</span>
          </label>
        ` : ''}
      </fieldset>
    `;
  }
}

/**
 * Create an input component with reactive get/set binding
 */
export function input(name: string, props: InputProps = {}): InputComponent {
  const ctx = getCurrentContext();

  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new InputComponent(name, props)));
  }

  return wrapValueComponent(new InputComponent(name, props));
}
