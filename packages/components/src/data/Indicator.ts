import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from '../layouts/build';

export interface IndicatorProps {
  badge?: string;
  className?: string;
}

const INDICATOR_KEYS = new Set(['badge', 'className']);

export class Indicator extends Component<IndicatorProps> {
  constructor(props: IndicatorProps = {}) {
    super(props, []);
  }

  render(): string {
    const classes = ['indicator', this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');

    return `
      <div id="${this.id}" class="${classes}"${this.getExtraStyles()}>
        ${this.props.badge ? `<span class="indicator-item badge badge-secondary">${this.props.badge}</span>` : ''}
        ${this.renderChildren()}
      </div>
    `;
  }
}

export function indicator(childrenFn: (i: Indicator) => void, props?: IndicatorProps): Indicator;
export function indicator(...args: (LayoutChild | IndicatorProps)[]): Indicator;
export function indicator(...args: unknown[]): Indicator {
  return buildLayout(Indicator, INDICATOR_KEYS, ...args);
}
