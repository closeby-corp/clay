import { Component } from '@badui/core';

export interface SwapProps {
  on?: string;
  off?: string;
  active?: boolean;
  rotate?: boolean;
  flip?: boolean;
  className?: string;
}

export class Swap extends Component<SwapProps> {
  render(): string {
    const classes = [
      'swap',
      this.props.rotate ? 'swap-rotate' : '',
      this.props.flip ? 'swap-flip' : '',
      this.props.className || '',
      this.getExtraClasses().trim(),
    ].filter(Boolean).join(' ');

    const activeClass = this.props.active ? 'swap-active' : '';

    return `
      <label id="${this.id}" class="${classes} ${activeClass}"${this.patchRegionAttr()}${this.getExtraStyles()}>
        <input type="checkbox" ${this.props.active ? 'checked' : ''} />
        <div class="swap-on">${this.props.on || this.renderChildren()}</div>
        <div class="swap-off">${this.props.off || ''}</div>
      </label>
    `;
  }
}

export function swap(on?: string, off?: string, props?: Omit<SwapProps, 'on' | 'off'>): Swap {
  return new Swap({ on, off, ...props });
}
