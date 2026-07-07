import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from './build';

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

const ROW_KEYS = new Set(['gap', 'align', 'justify', 'wrap', 'className', 'responsive']);

export class Row extends Component<RowProps> {
  constructor(props: RowProps = {}) {
    super(props, []);
  }
  
  render(): string {
    const classes = this.generateClasses() + this.getExtraClasses();

    return `<div id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>${this.renderChildren()}</div>`;
  }

  private generateClasses(): string {
    const parts = ['flex', 'flex-row'];

    if (this.props.gap) {
      parts.push(`gap-${this.props.gap}`);
    } else {
      parts.push('gap-4');
    }

    if (this.props.align) {
      parts.push(`items-${this.props.align}`);
    } else {
      parts.push('items-center');
    }

    if (this.props.justify) {
      parts.push(`justify-${this.props.justify}`);
    }

    if (this.props.wrap) {
      parts.push('flex-wrap');
    }

    if (this.props.responsive) {
      parts.push('flex-col', 'md:flex-row');
    }

    if (this.props.className) {
      parts.push(this.props.className);
    }

    return parts.join(' ');
  }
}

export function row(childrenFn: (row: Row) => void, props?: RowProps): Row;
export function row(...args: (LayoutChild | RowProps)[]): Row;
export function row(...args: unknown[]): Row {
  return buildLayout(Row, ROW_KEYS, ...args);
}
