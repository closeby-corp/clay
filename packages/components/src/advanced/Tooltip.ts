import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from '../layouts/build';

export interface TooltipProps {
  tip: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  open?: boolean;
  className?: string;
}

const TOOLTIP_KEYS = new Set(['tip', 'position', 'open', 'className']);

export class Tooltip extends Component<TooltipProps> {
  constructor(props: TooltipProps = { tip: '' }) {
    super(props, []);
  }

  render(): string {
    const posClass = this.props.position ? `tooltip-${this.props.position}` : 'tooltip';
    const openClass = this.props.open ? 'tooltip-open' : '';
    const classes = [posClass, openClass, this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    return `<div id="${this.id}" class="${classes}" data-tip="${this.props.tip}"${this.patchRegionAttr()}${this.getExtraStyles()}>${this.renderChildren()}</div>`;
  }
}

export function tooltip(childrenFn: (t: Tooltip) => void, props: TooltipProps): Tooltip;
export function tooltip(...args: (LayoutChild | TooltipProps)[]): Tooltip;
export function tooltip(...args: unknown[]): Tooltip {
  return buildLayout(Tooltip, TOOLTIP_KEYS, ...args);
}
