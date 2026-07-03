import { ValueComponent, eventRegistry, getCurrentContext, wrapValueComponent } from '@badui/core';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  value?: string;
  on_change?: (value: string) => void;
}

export class SelectComponent extends ValueComponent<string, SelectProps> {
  private _initialized = false;

  constructor(name: string, props: SelectProps) {
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

    const { label, options, placeholder, disabled, size, fullWidth } = this.props;

    const selectClasses = [
      'select',
      size && size !== 'md' ? `select-${size}` : '',
      fullWidth ? 'w-full' : ''
    ].filter(Boolean).join(' ');

    const postAction = this.getDataStarPostAction('change', this._name);

    return `
      <fieldset id="${this.id}" class="fieldset ${fullWidth ? 'w-full' : ''}">
        ${label ? `
          <label class="label">
            ${label}
          </label>
        ` : ''}
        <select 
          class="${selectClasses}"
          ${disabled ? 'disabled' : ''}
          data-bind="${this._name}"
          data-on:change="${postAction}"
        >
          ${placeholder ? `
            <option disabled ${!this._value ? 'selected' : ''}>
              ${placeholder}
            </option>
          ` : ''}
          ${options.map(opt => `
            <option 
              value="${opt.value}"
              ${opt.disabled ? 'disabled' : ''}
              ${this._value === opt.value ? 'selected' : ''}
            >
              ${opt.label}
            </option>
          `).join('')}
        </select>
      </fieldset>
    `;
  }
}

/**
 * Create a select component with reactive get/set binding
 */
export function select(name: string, options: SelectOption[], props: Omit<SelectProps, 'options'> = {}): SelectComponent {
  const ctx = getCurrentContext();

  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new SelectComponent(name, { ...props, options })));
  }

  return wrapValueComponent(new SelectComponent(name, { ...props, options }));
}
