import { ValueComponent, eventRegistry, getCurrentContext, wrapValueComponent } from '@badui/core';

export interface ToggleProps {
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  on_change?: (value: boolean) => void;
}

export class ToggleComponent extends ValueComponent<boolean, ToggleProps> {
  private _initialized = false;

  constructor(name: string, props: ToggleProps = {}) {
    super(name, props.checked ?? false, props);
  }

  private _ensureInitialized(): void {
    if (this._initialized) return;
    this._initialized = true;
    if (this.props.on_change) this.onValueChange(this.props.on_change);
    eventRegistry.register(this.id, 'change', (data) => {
      this.set(data.value === 'true' || data.value === true || data.value === 'on');
    });
  }

  render(): string {
    this._ensureInitialized();
    const classes = [
      'toggle',
      this.props.color ? `toggle-${this.props.color}` : '',
      this.props.size && this.props.size !== 'md' ? `toggle-${this.props.size}` : '',
    ].filter(Boolean).join(' ');

    const postAction = this.getDataStarPostAction('change', this._name);

    return `
      <label id="${this.id}" class="label cursor-pointer gap-2">
        ${this.props.label ? `<span>${this.props.label}</span>` : ''}
        <input type="checkbox" class="${classes}"
          ${this.props.disabled ? 'disabled' : ''} data-bind="${this._name}" data-on:change="${postAction}" />
      </label>
    `;
  }
}

export function toggle(name: string, props: ToggleProps = {}): ToggleComponent {
  const ctx = getCurrentContext();
  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new ToggleComponent(name, props)));
  }
  return wrapValueComponent(new ToggleComponent(name, props));
}
