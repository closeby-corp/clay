import { ValueComponent, eventRegistry, getCurrentContext, wrapValueComponent } from '@badui/core';

export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  on_change?: (value: boolean) => void;
}

export class CheckboxComponent extends ValueComponent<boolean, CheckboxProps> {
  private _initialized = false;

  constructor(name: string, props: CheckboxProps = {}) {
    const initialValue = props.checked ?? false;
    super(name, initialValue, props);
  }

  private _ensureInitialized(): void {
    if (this._initialized) return;
    this._initialized = true;

    if (this.props.on_change) {
      this.onValueChange(this.props.on_change);
    }

    eventRegistry.register(this.id, 'change', (data) => {
      const newValue = data.value === 'true' || data.value === true || data.value === 'on';
      this.set(newValue);
    });
  }

  render(): string {
    this._ensureInitialized();

    const { label, disabled, indeterminate, color } = this.props;

    const checkboxClasses = [
      'checkbox',
      color ? `checkbox-${color}` : '',
      indeterminate ? 'checkbox-indeterminate' : ''
    ].filter(Boolean).join(' ');

    const postAction = this.getDataStarPostAction('change', this._name);

    return `
      <fieldset id="${this.id}" class="fieldset">
        <label class="label cursor-pointer justify-start gap-4">
          <input 
            type="checkbox"
            class="${checkboxClasses}"
            ${disabled ? 'disabled' : ''}
            data-bind="${this._name}"
            data-on:change="${postAction}"
          />
          ${label ? `<span>${label}</span>` : ''}
        </label>
      </fieldset>
    `;
  }

  toggle(): void {
    this.set(!this.get());
  }
}

/**
 * Create a checkbox component with reactive get/set binding
 */
export function checkbox(name: string, props: CheckboxProps = {}): CheckboxComponent {
  const ctx = getCurrentContext();

  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new CheckboxComponent(name, props)));
  }

  return wrapValueComponent(new CheckboxComponent(name, props));
}
