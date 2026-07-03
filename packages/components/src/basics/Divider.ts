import { Component } from '@badui/core';

export interface DividerProps {
  text?: string;
  horizontal?: boolean;
  vertical?: boolean;
  className?: string;
}

export class Divider extends Component<DividerProps> {
  render(): string {
    const classes = [
      'divider',
      this.props.vertical ? 'divider-vertical' : '',
      this.props.horizontal !== false && !this.props.vertical ? 'divider-horizontal' : '',
      this.props.className || '',
      this.getExtraClasses().trim(),
    ].filter(Boolean).join(' ');

    const content = this.props.text || this.renderChildren();
    return `<div id="${this.id}" class="${classes}"${this.getExtraStyles()}>${content}</div>`;
  }
}

export function divider(text?: string, props?: Omit<DividerProps, 'text'>): Divider {
  return new Divider({ text, ...props });
}
