import { Component } from '@ralph/core';
import type { GapSize, AlignItems, JustifyContent } from './Row';

export interface ColumnProps {
  gap?: GapSize;
  align?: AlignItems;
  justify?: JustifyContent;
  className?: string;
}

export class Column extends Component<ColumnProps> {
  render(): string {
    const classes = this.generateClasses();

    return `
      <div id="${this.id}" class="${classes}">
        ${this.renderChildren()}
      </div>
    `;
  }

  private generateClasses(): string {
    const parts = ['flex', 'flex-col'];

    // Gap
    if (this.props.gap) {
      parts.push(`gap-${this.props.gap}`);
    } else {
      parts.push('gap-4');
    }

    // Alignment
    if (this.props.align) {
      parts.push(`items-${this.props.align}`);
    }

    // Justify
    if (this.props.justify) {
      parts.push(`justify-${this.props.justify}`);
    }

    // Custom classes
    if (this.props.className) {
      parts.push(this.props.className);
    }

    return parts.join(' ');
  }
}

// Functional API
export function column(children: () => void, props?: ColumnProps): Column {
  return new Column(props || {});
}
