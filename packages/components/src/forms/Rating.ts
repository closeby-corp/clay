import { ValueComponent, eventRegistry, getCurrentContext, wrapValueComponent } from '@badui/core';

export interface RatingProps {
  max?: number;
  value?: number;
  half?: boolean;
  readonly?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  on_change?: (value: number) => void;
}

export class RatingComponent extends ValueComponent<number, RatingProps> {
  private _initialized = false;

  constructor(name: string, props: RatingProps = {}) {
    super(name, props.value ?? 0, props);
  }

  private _ensureInitialized(): void {
    if (this._initialized) return;
    this._initialized = true;
    if (this.props.on_change) this.onValueChange(this.props.on_change);
    eventRegistry.register(this.id, 'change', (data) => {
      this.set(parseInt(data.value ?? '0', 10));
    });
  }

  render(): string {
    this._ensureInitialized();
    const max = this.props.max ?? 5;
    const sizeClass = this.props.size && this.props.size !== 'md' ? `rating-${this.props.size}` : '';
    const postAction = this.getDataStarPostAction('change', this._name);

    const inputs = Array.from({ length: max }, (_, i) => {
      const val = i + 1;
      const checked = this._value === val ? 'checked' : '';
      const halfClass = this.props.half ? 'mask-half-1' : '';
      return `<input type="radio" name="${this._name}-rating" class="mask mask-star-2 ${halfClass}" aria-label="${val} star" value="${val}" ${checked} ${this.props.readonly ? 'disabled' : ''} data-on:change="${postAction}" />`;
    }).join('');

    return `<div id="${this.id}" class="rating ${sizeClass}">${inputs}</div>`;
  }
}

export function rating(name: string, props: RatingProps = {}): RatingComponent {
  const ctx = getCurrentContext();
  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new RatingComponent(name, props)));
  }
  return wrapValueComponent(new RatingComponent(name, props));
}
