import { Component } from '@badui/core';

export type StatusType = 'info' | 'success' | 'warning' | 'error';

export interface StatusProps {
  type?: StatusType;
  className?: string;
}

export class Status extends Component<StatusProps> {
  render(): string {
    const classes = ['status', this.props.type ? `status-${this.props.type}` : 'status-info', this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    return `<span id="${this.id}" class="${classes}" aria-label="${this.props.type || 'info'}"${this.getExtraStyles()}></span>`;
  }
}

export function status(props?: StatusProps): Status {
  return new Status(props ?? {});
}
