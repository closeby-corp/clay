import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from './build';

export type JoinDirection = 'horizontal' | 'vertical';

export interface JoinProps {
  direction?: JoinDirection;
  className?: string;
}

const JOIN_KEYS = new Set(['direction', 'className']);

export class Join extends Component<JoinProps> {
  constructor(props: JoinProps = {}) {
    super(props, []);
  }

  render(): string {
    const classes = [
      'join',
      this.props.direction === 'vertical' ? 'join-vertical' : 'join-horizontal',
      this.props.className || '',
      this.getExtraClasses().trim(),
    ].filter(Boolean).join(' ');

    return `<div id="${this.id}" class="${classes}"${this.getExtraStyles()}>${this.renderChildren()}</div>`;
  }
}

export function join(childrenFn: (j: Join) => void, props?: JoinProps): Join;
export function join(...args: (LayoutChild | JoinProps)[]): Join;
export function join(...args: unknown[]): Join {
  return buildLayout(Join, JOIN_KEYS, ...args);
}
