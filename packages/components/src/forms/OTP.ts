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
    const inputs = Array.from({ length: len }, () => {
      return `<input type="text" maxlength="1" class="input join-item w-12 text-center" ${this.props.disabled ? 'disabled' : ''} data-on:input="${postAction}" />`;
    }).join('');

    return `<div id="${this.id}" class="join"${this.patchRegionAttr()}><input type="hidden" data-bind="${this._name}" />${inputs}</div>`;
  }
}

export function otp(name: string, props: OTPProps = {}): OTPComponent {
  const ctx = getCurrentContext();
  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new OTPComponent(name, props)));
  }
  return wrapValueComponent(new OTPComponent(name, props));
}
