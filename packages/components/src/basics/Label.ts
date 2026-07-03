import { Component, State, type HasValue } from '@badui/core';

export type LabelSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
export type LabelWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
export type LabelColor = 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'base-content';

export interface LabelProps {
  text?: string | (() => string);
  size?: LabelSize;
  weight?: LabelWeight;
  color?: LabelColor;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label';
  truncate?: boolean;
  className?: string;
}

export type LabelContent = string | HasValue<any> | (() => string);

export class Label extends Component<LabelProps> {
  private dynamicFn?: () => string;
  private boundState?: State<any>;
  private boundValueComponent?: HasValue<any>;
  
  constructor(props: LabelProps) {
    super(props);
    if (typeof props.text === 'function') {
      this.dynamicFn = props.text;
    }
  }
  
  render(): string {
    const classes = this.generateClasses() + this.getExtraClasses();
    const tag = this.props.as || 'span';
    
    let text: string;
    if (this.boundValueComponent) {
      text = String(this.boundValueComponent);
    } else if (this.dynamicFn) {
      text = this.dynamicFn();
    } else {
      text = this.props.text as string || '';
    }
    
    const content = this.props.truncate 
      ? `<span class="truncate block">${text}</span>`
      : text;

    return `<${tag} id="${this.id}" class="${classes}"${this.getExtraStyles()}${this.getTooltipAttr()}>${content}</${tag}>`;
  }
  
  bind_text_from<T>(source: State<T> | { get(): T }, property?: keyof T): this {
    this.dynamicFn = () => {
      const val = source.get();
      if (property && typeof val === 'object' && val !== null) {
        return String((val as any)[property]);
      }
      return String(val);
    };
    return this;
  }
  
  bind(state: State<any>): this {
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

/**
 * Create a label component
 * @param content - String, ValueComponent (slider, input, etc.), or getter function
 * @param props - Optional label props
 * 
 * Examples:
 *   label('Hello')                    // Static text
 *   label(slider)                     // Binds via toString/get()
 *   label(() => `Count: ${count}`)    // Dynamic function
 *   label(`Volume: ${slider}`)        // Template string (uses toString)
 */
export function label(content?: LabelContent, props?: Omit<LabelProps, 'text'>): Label {
  if (content && typeof content === 'object' && typeof (content as HasValue<unknown>).get === 'function') {
    const lbl = new Label({ ...props });
    lbl['boundValueComponent'] = content;
    return lbl;
  }
  
  if (typeof content === 'function') {
    return new Label({ text: content, ...props });
  }
  
  return new Label({ text: content as string, ...props });
}
