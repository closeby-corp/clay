import { Component, State, type HasValue } from '@badui/core';

export type LabelSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
export type LabelWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
export type LabelColor = 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'base-content';

export interface LabelProps {
  text?: string | (() => string);
  /** Datastar expression for reactive text, e.g. "'Count: ' + $count" */
  textExpr?: string;
  /** Datastar expression for visibility, e.g. "$history.length" */
  showExpr?: string;
  size?: LabelSize;
  weight?: LabelWeight;
  color?: LabelColor;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label';
  truncate?: boolean;
  className?: string;
}

export type LabelContent = string | HasValue<unknown> | (() => string) | Omit<LabelProps, never>;

export class Label extends Component<LabelProps> {
  private dynamicFn?: () => string;
  private boundState?: State<unknown>;
  private boundValueComponent?: HasValue<unknown>;
  
  constructor(props: LabelProps) {
    super(props);
    if (typeof props.text === 'function') {
      this.dynamicFn = props.text;
    }
  }
  
  render(): string {
    const classes = this.generateClasses() + this.getExtraClasses();
    const tag = this.props.as || 'span';
    const textAttr = this.props.textExpr ? this.signalText(this.props.textExpr) : '';
    const showAttr = this.props.showExpr ? this.signalShow(this.props.showExpr) : '';

    let inner: string;
    if (this.props.textExpr) {
      inner = '';
    } else if (this.boundValueComponent) {
      const text = String(this.boundValueComponent);
      inner = this.props.truncate
        ? `<span class="truncate block">${text}</span>`
        : text;
    } else if (this.dynamicFn) {
      const text = this.dynamicFn();
      inner = this.props.truncate
        ? `<span class="truncate block">${text}</span>`
        : text;
    } else {
      const text = (this.props.text as string) || '';
      inner = this.props.truncate
        ? `<span class="truncate block">${text}</span>`
        : text;
    }

    const el = `<${tag} id="${this.id}" class="${classes}"${textAttr}${showAttr}${this.getExtraStyles()}${this.getTooltipAttr()}>${inner}</${tag}>`;
    return el;
  }
  
  bind_text_from<T>(source: State<T> | { get(): T }, property?: keyof T): this {
    this.dynamicFn = () => {
      const val = source.get();
      if (property && typeof val === 'object' && val !== null) {
        return String((val as Record<string, unknown>)[property as string]);
      }
      return String(val);
    };
    return this;
  }
  
  bind(state: State<unknown>): this {
    this.boundState = state;
    return this;
  }

  private generateClasses(): string {
    const parts: string[] = [];

    if (this.props.size) {
      parts.push(`text-${this.props.size}`);
    }

    if (this.props.weight) {
      parts.push(`font-${this.props.weight}`);
    }

    if (this.props.color) {
      parts.push(`text-${this.props.color}`);
    }
    
    if (this.props.className) {
      parts.push(this.props.className);
    }

    return parts.join(' ') || 'text-base';
  }
}

export function label(content?: LabelContent, props?: Omit<LabelProps, 'text'>): Label {
  if (content && typeof content === 'object' && !('get' in content) && ('textExpr' in content || 'text' in content || 'showExpr' in content)) {
    return new Label(content as LabelProps);
  }

  if (content && typeof content === 'object' && typeof (content as HasValue<unknown>).get === 'function') {
    const lbl = new Label({ ...props });
    (lbl as { boundValueComponent?: HasValue<unknown> }).boundValueComponent = content as HasValue<unknown>;
    return lbl;
  }
  
  if (typeof content === 'function') {
    return new Label({ text: content, ...props });
  }
  
  return new Label({ text: content as string, ...props });
}
