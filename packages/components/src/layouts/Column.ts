import { Component } from '@badui/core';
import type { GapSize, AlignItems, JustifyContent } from './Row';
import { buildLayout, type LayoutChild } from './build';

export interface ColumnProps {
  gap?: GapSize;
  align?: AlignItems;
  justify?: JustifyContent;
  className?: string;
}

const COLUMN_KEYS = new Set(['gap', 'align', 'justify', 'className']);

export class Column extends Component<ColumnProps> {
  constructor(props: ColumnProps = {}) {
    super(props, []);
  }
  
  render(): string {
    const classes = this.generateClasses() + this.getExtraClasses();

    return `<div id="${this.id}" class="${classes}"${this.getExtraStyles()}>${this.renderChildren()}</div>`;
  }

  private generateClasses(): string {
    const parts = ['flex', 'flex-col'];

    if (this.props.gap) {
      parts.push(`gap-${this.props.gap}`);
    } else {
      parts.push('gap-4');
    }

    if (this.props.align) {
      parts.push(`items-${this.props.align}`);
    }

    if (this.props.justify) {
      parts.push(`justify-${this.props.justify}`);
    }

    if (this.props.className) {
      parts.push(this.props.className);
    }

    return parts.join(' ');
  }
}

export function column(childrenFn: (column: Column) => void, props?: ColumnProps): Column;
export function column(...args: (LayoutChild | ColumnProps)[]): Column;
export function column(...args: unknown[]): Column {
  return buildLayout(Column, COLUMN_KEYS, ...args);
}
