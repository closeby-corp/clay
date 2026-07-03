import { Component } from '@badui/core';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  message?: string;
  title?: string;
  type?: AlertType;
  className?: string;
}

export class Alert extends Component<AlertProps> {
  render(): string {
    const classes = [
      'alert',
      this.props.type ? `alert-${this.props.type}` : 'alert-info',
      this.props.className || '',
      this.getExtraClasses().trim(),
    ].filter(Boolean).join(' ');

    const body = this.props.message || this.renderChildren();
    return `
      <div id="${this.id}" role="alert" class="${classes}"${this.getExtraStyles()}${this.getTooltipAttr()}>
        ${this.props.title ? `<h3 class="font-bold">${this.props.title}</h3>` : ''}
        ${body ? `<span>${body}</span>` : ''}
      </div>
    `;
  }
}

export function alert(message?: string, props?: Omit<AlertProps, 'message'>): Alert {
  return new Alert({ message, ...props });
}
