import { Component } from '@ralph/core';

export type LabelSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
export type LabelWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
export type LabelColor = 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'base-content';

export interface LabelProps {
  text: string;
  size?: LabelSize;
  weight?: LabelWeight;
  color?: LabelColor;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label';
  truncate?: boolean;
}

export class Label extends Component<LabelProps> {
  render(): string {
    const classes = this.generateClasses();
    const tag = this.props.as || 'span';
    const text = this.props.truncate 
      ? `<span class="truncate block">${this.props.text}</span>`
      : this.props.text;

    return `<${tag} id="${this.id}" class="${classes}">${text}</${tag}>`;
  }

  private generateClasses(): string {
    const parts: string[] = [];

    // Size
    if (this.props.size) {
      parts.push(`text-${this.props.size}`);
    }

    // Weight
    if (this.props.weight) {
      parts.push(`font-${this.props.weight}`);
    }

    // Color
    if (this.props.color) {
      parts.push(`text-${this.props.color}`);
    }

    return parts.join(' ') || 'text-base';
  }
}

// Functional API
export function label(text: string, props?: Omit<LabelProps, 'text'>): Label {
  return new Label({ text, ...props });
}
