import { ValueComponent, eventRegistry, getCurrentContext, wrapValueComponent } from '@badui/core';

export type ColorPickerSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ColorPickerProps {
  label?: string;
  size?: ColorPickerSize;
  disabled?: boolean;
  showHex?: boolean;
  presets?: string[];
  value?: string;
  on_change?: (value: string) => void;
}

const DEFAULT_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#000000', '#6b7280', '#ffffff'
];

export class ColorPickerComponent extends ValueComponent<string, ColorPickerProps> {
  private _initialized = false;

  constructor(name: string, props: ColorPickerProps = {}) {
    const initialValue = props.value ?? '#3b82f6';
    super(name, initialValue, props);
  }

  private _ensureInitialized(): void {
    if (this._initialized) return;
    this._initialized = true;

    if (this.props.on_change) {
      this.onValueChange(this.props.on_change);
    }

    eventRegistry.register(this.id, 'change', (data) => {
      const newValue = data.value ?? '#3b82f6';
      this.set(newValue);
    });
  }

  render(): string {
    this._ensureInitialized();

    const { label, size, disabled, showHex = true, presets = DEFAULT_PRESETS } = this.props;

    const sizeClasses: Record<string, string> = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    };

    const colorInputSize = sizeClasses[size || 'md'];
    const postAction = this.getDataStarPostAction('change', this._name);

    const presetsHtml = presets.map(color => {
      const presetAction = `$compId='${this.id}'; $evtType='change'; $dsValKey='${this._name}'; $${this._name}='${color}'; ${getCurrentContext() ? `$ctxId='${getCurrentContext()!.id}'; ` : ''}@post('/badui/events')`;
      return `<button
        type="button"
        class="w-6 h-6 rounded border-2 ${this._value === color ? 'border-primary' : 'border-transparent'} hover:scale-110 transition-transform"
        style="background-color: ${color}"
        ${disabled ? 'disabled' : ''}
        data-on:click="${presetAction}"
      ></button>`;
    }).join('');

    return `
      <fieldset id="${this.id}" class="fieldset">
        ${label ? `<label class="label">${label}</label>` : ''}
        <div class="flex items-center gap-3">
          <input 
            type="color"
            class="${colorInputSize} cursor-pointer rounded border-0"
            ${disabled ? 'disabled' : ''}
            data-bind="${this._name}"
            data-on:change="${postAction}"
          />
          ${showHex ? `<span class="font-mono text-sm"${this.signalText(`$${this._name}`)}></span>` : ''}
        </div>
        ${presets.length > 0 ? `
          <div class="flex flex-wrap gap-1 mt-2">
            ${presetsHtml}
          </div>
        ` : ''}
      </fieldset>
    `;
  }

  getRGB(): { r: number; g: number; b: number } {
    const hex = this._value.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }

  setRGB(r: number, g: number, b: number): void {
    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    this.set(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
  }
}

export function colorPicker(name: string, props: ColorPickerProps = {}): ColorPickerComponent {
  const ctx = getCurrentContext();

  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new ColorPickerComponent(name, props)));
  }

  return wrapValueComponent(new ColorPickerComponent(name, props));
}
