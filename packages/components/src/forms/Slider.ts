import { ValueComponent, eventRegistry, getCurrentContext, wrapValueComponent } from '@badui/core';

export interface SliderProps {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  showValue?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  on_change?: (value: number) => void;
}

export class SliderComponent extends ValueComponent<number, SliderProps> {
  private _initialized = false;

  constructor(name: string, props: SliderProps = {}) {
    const initialValue = props.value ?? props.min ?? 0;
    super(name, initialValue, props);
  }

  private _ensureInitialized(): void {
    if (this._initialized) return;
    this._initialized = true;

    if (this.props.on_change) {
      this.onValueChange(this.props.on_change);
    }

    eventRegistry.register(this.id, 'change', (data) => {
      const newValue = parseFloat(data.value ?? '0');
      this.set(newValue);
    });
  }

  render(): string {
    this._ensureInitialized();

    const { min = 0, max = 100, step = 1, label, showValue, disabled, size, color } = this.props;

    const rangeClasses = [
      'range',
      size && size !== 'md' ? `range-${size}` : '',
      color ? `range-${color}` : ''
    ].filter(Boolean).join(' ');

    const postAction = this.getDataStarPostAction('change', this._name);

    return `
      <fieldset id="${this.id}" class="fieldset w-full">
        ${label || showValue ? `
          <label class="label flex justify-between">
            ${label ? `<span>${label}</span>` : '<span></span>'}
            ${showValue ? `<span class="text-sm opacity-70">${this._value}</span>` : ''}
          </label>
        ` : ''}
        <input 
          type="range"
          min="${min}"
          max="${max}"
          step="${step}"
          value="${this._value}"
          class="${rangeClasses}"
          ${disabled ? 'disabled' : ''}
          data-bind="${this._name}"
          data-on:change="${postAction}"
        />
      </fieldset>
    `;
  }
}

/**
 * Create a slider component with reactive get/set binding
 */
export function slider(name: string, props: SliderProps = {}): SliderComponent {
  const ctx = getCurrentContext();

  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new SliderComponent(name, props)));
  }

  return wrapValueComponent(new SliderComponent(name, props));
}
