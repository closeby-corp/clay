import { ValueComponent, eventRegistry, getCurrentContext, wrapValueComponent } from '@badui/core';

export interface OTPProps {
  length?: number;
  value?: string;
  disabled?: boolean;
  on_change?: (value: string) => void;
}

export class OTPComponent extends ValueComponent<string, OTPProps> {
  private _initialized = false;

  constructor(name: string, props: OTPProps = {}) {
    super(name, props.value ?? '', props);
  }

  private _ensureInitialized(): void {
    if (this._initialized) return;
    this._initialized = true;
    if (this.props.on_change) this.onValueChange(this.props.on_change);
    eventRegistry.register(this.id, 'input', (data) => {
      this.set(String(data.value ?? ''));
    });
  }

  render(): string {
    this._ensureInitialized();
    const len = this.props.length ?? 4;
    const postAction = this.getDataStarPostAction('input', this._name);
    const chars = this._value.split('');

    const inputs = Array.from({ length: len }, (_, i) => {
      const val = chars[i] ?? '';
      return `<input type="text" maxlength="1" class="input join-item w-12 text-center" value="${val}" ${this.props.disabled ? 'disabled' : ''} data-on:input="${postAction}" />`;
    }).join('');

    return `<div id="${this.id}" class="join">${inputs}</div>`;
  }
}

export function otp(name: string, props: OTPProps = {}): OTPComponent {
  const ctx = getCurrentContext();
  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new OTPComponent(name, props)));
  }
  return wrapValueComponent(new OTPComponent(name, props));
}
