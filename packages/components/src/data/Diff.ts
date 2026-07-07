import { Component } from '@badui/core';

export interface DiffProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export class Diff extends Component<DiffProps> {
  render(): string {
    const classes = ['diff', 'aspect-16/9', this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');

    return `
      <figure id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>
        <div class="diff-item-1" role="img">${this.props.beforeLabel ? `<div class="bg-primary text-primary-content grid place-content-center text-2xl font-black">${this.props.beforeLabel}</div>` : `<img src="${this.props.before}" alt="before" />`}</div>
        <div class="diff-item-2" role="img">${this.props.afterLabel ? `<div class="bg-base-200 grid place-content-center text-2xl font-black">${this.props.afterLabel}</div>` : `<img src="${this.props.after}" alt="after" />`}</div>
        <div class="diff-resizer"></div>
      </figure>
    `;
  }
}

export function diff(before: string, after: string, props?: Omit<DiffProps, 'before' | 'after'>): Diff {
  return new Diff({ before, after, ...props });
}
