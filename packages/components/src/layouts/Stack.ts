import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from './build';

export interface StackProps {
  vertical?: boolean;
  className?: string;
}

const STACK_KEYS = new Set(['vertical', 'className']);

export class Stack extends Component<StackProps> {
  constructor(props: StackProps = {}) {
    super(props, []);
  }

  render(): string {
    const classes = [
      'stack',
      this.props.vertical === false ? 'stack-horizontal' : '',
      this.props.className || '',
      this.getExtraClasses().trim(),
    ].filter(Boolean).join(' ');

    return `<div id="${this.id}" class="${classes}"${this.getExtraStyles()}>${this.renderChildren()}</div>`;
  }
}

export function stack(childrenFn: (s: Stack) => void, props?: StackProps): Stack;
export function stack(...args: (LayoutChild | StackProps)[]): Stack;
export function stack(...args: unknown[]): Stack {
  return buildLayout(Stack, STACK_KEYS, ...args);
}
