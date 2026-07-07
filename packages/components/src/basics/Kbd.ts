import { Component } from '@badui/core';

export type KbdSize = 'xs' | 'sm' | 'md' | 'lg';

export interface KbdProps {
  keys?: string | string[];
  size?: KbdSize;
  className?: string;
}

export class Kbd extends Component<KbdProps> {
  render(): string {
    const keys = this.props.keys
      ? (Array.isArray(this.props.keys) ? this.props.keys : [this.props.keys])
      : [];

    const sizeClass = this.props.size && this.props.size !== 'md' ? `kbd-${this.props.size}` : '';
    const extra = [this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');

    const rendered = keys.length > 0
      ? keys.map((k) => `<kbd class="kbd ${sizeClass} ${extra}">${k}</kbd>`).join(' ')
      : `<kbd id="${this.id}" class="kbd ${sizeClass} ${extra}"${this.patchRegionAttr()}${this.getExtraStyles()}>${this.renderChildren()}</kbd>`;

    return keys.length > 0 ? `<span id="${this.id}"${this.patchRegionAttr()}>${rendered}</span>` : rendered;
  }
}

export function kbd(keys?: string | string[], props?: Omit<KbdProps, 'keys'>): Kbd {
  return new Kbd({ keys, ...props });
}
