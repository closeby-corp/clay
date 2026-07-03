import { ValueComponent, eventRegistry, getCurrentContext, wrapValueComponent } from '@badui/core';

export type RadioSize = 'xs' | 'sm' | 'md' | 'lg';
export type RadioColor = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface RadioProps {
  options: RadioOption[];
  label?: string;
  size?: RadioSize;
  color?: RadioColor;
  disabled?: boolean;
  inline?: boolean;
  value?: string;
  on_change?: (value: string) => void;
}

export class RadioComponent extends ValueComponent<string, RadioProps> {
  private _initialized = false;

  constructor(name: string, props: RadioProps) {
    const initialValue = props.value ?? (props.options.length > 0 ? props.options[0].value : '');
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

    const { options, label, size, color, disabled, inline } = this.props;

    const radioClasses = [
      'radio',
      size && size !== 'md' ? `radio-${size}` : '',
      color ? `radio-${color}` : ''
    ].filter(Boolean).join(' ');

    const containerClass = inline ? 'flex flex-row gap-4 flex-wrap' : 'flex flex-col gap-2';
    const postAction = this.getDataStarPostAction('change', this._name);

    const optionsHtml = options.map(opt => `
      <label class="label cursor-pointer justify-start gap-2">
        <input 
          type="radio"
          value="${opt.value}"
          class="${radioClasses}"
          ${this._value === opt.value ? 'checked' : ''}
          ${disabled || opt.disabled ? 'disabled' : ''}
          data-bind="${this._name}"
          data-on:change="${postAction}"
        />
        <span>${opt.label}</span>
      </label>
    `).join('');

    return `
      <fieldset id="${this.id}" class="fieldset">
        ${label ? `<label class="label font-medium">${label}</label>` : ''}
        <div class="${containerClass}">
          ${optionsHtml}
        </div>
      </fieldset>
    `;
  }
}

export function radio(name: string, props: RadioProps): RadioComponent {
  const ctx = getCurrentContext();

  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new RadioComponent(name, props)));
  }

  return wrapValueComponent(new RadioComponent(name, props));
}
