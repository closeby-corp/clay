import { Component } from '@ralph/core';

export type GapSize = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12';
export type AlignItems = 'start' | 'center' | 'end' | 'stretch';
export type JustifyContent = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

export interface RowProps {
  gap?: GapSize;
  align?: AlignItems;
  justify?: JustifyContent;
  wrap?: boolean;
  className?: string;
  responsive?: boolean;
}

export class Row extends Component<RowProps> {
  render(): string {
    const classes = this.generateClasses();

    return `
      <div id="${this.id}" class="${classes}">
        ${this.renderChildren()}
      </div>
    `;
  }

  private generateClasses(): string {
    const parts = ['flex', 'flex-row'];

    // Gap
    if (this.props.gap) {
      parts.push(`gap-${this.props.gap}`);
    } else {
      parts.push('gap-4');
    }

    // Alignment
    if (this.props.align) {
      parts.push(`items-${this.props.align}`);
    } else {
      parts.push('items-center');
    }

    // Justify
    if (this.props.justify) {
      parts.push(`justify-${this.props.justify}`);
    }

    // Wrap
    if (this.props.wrap) {
      parts.push('flex-wrap');
    }

    // Responsive
    if (this.props.responsive) {
      parts.push('flex-col', 'md:flex-row');
    }

    // Custom classes
    if (this.props.className) {
      parts.push(this.props.className);
    }

    return parts.join(' ');
  }
}

// Functional API
export function row(children: () => void, props?: RowProps): Row {
  return new Row(props || {});
}
