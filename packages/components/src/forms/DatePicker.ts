import { ValueComponent, eventRegistry, getCurrentContext, wrapValueComponent } from '@badui/core';

export type DatePickerSize = 'xs' | 'sm' | 'md' | 'lg';
export type DatePickerType = 'date' | 'datetime-local' | 'time' | 'month' | 'week';

export interface DatePickerProps {
  type?: DatePickerType;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  size?: DatePickerSize;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  value?: string;
  on_change?: (value: string) => void;
}

export class DatePickerComponent extends ValueComponent<string, DatePickerProps> {
  private _initialized = false;

  constructor(name: string, props: DatePickerProps = {}) {
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

    const { type = 'date', label, placeholder, min, max, size, disabled, required, fullWidth } = this.props;

    const inputClasses = [
      'input',
      size && size !== 'md' ? `input-${size}` : '',
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
        <input 
          type="${type}"
          class="${inputClasses}"
          ${placeholder ? `placeholder="${placeholder}"` : ''}
          ${min ? `min="${min}"` : ''}
          ${max ? `max="${max}"` : ''}
          ${disabled ? 'disabled' : ''}
          ${required ? 'required' : ''}
          data-bind="${this._name}"
          data-on:change="${postAction}"
        />
      </fieldset>
    `;
  }

  getDate(): Date | null {
    if (!this._value) return null;
    return new Date(this._value);
  }

  setDate(date: Date): void {
    this.set(date.toISOString().split('T')[0]);
  }
}

export function datePicker(name: string, props: DatePickerProps = {}): DatePickerComponent {
  const ctx = getCurrentContext();

  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new DatePickerComponent(name, props)));
  }

  return wrapValueComponent(new DatePickerComponent(name, props));
}

export function timePicker(name: string, props: Omit<DatePickerProps, 'type'> = {}): DatePickerComponent {
  return datePicker(name, { ...props, type: 'time' });
}

export function dateTimePicker(name: string, props: Omit<DatePickerProps, 'type'> = {}): DatePickerComponent {
  return datePicker(name, { ...props, type: 'datetime-local' });
}
