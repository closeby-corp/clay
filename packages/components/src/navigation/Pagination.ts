import { Component } from '@badui/core';

export interface PaginationProps {
  current?: number;
  total?: number;
  prevHref?: string;
  nextHref?: string;
  className?: string;
}

export class Pagination extends Component<PaginationProps> {
  render(): string {
    const current = this.props.current ?? 1;
    const total = this.props.total ?? 1;
    const classes = ['join', this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');

    const pages = Array.from({ length: total }, (_, i) => {
      const page = i + 1;
      const active = page === current ? 'btn-active' : '';
      return `<button class="join-item btn ${active}">${page}</button>`;
    }).join('');

    return `
      <div id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>
        <a class="join-item btn" href="${this.props.prevHref || '#'}">«</a>
        ${pages}
        <a class="join-item btn" href="${this.props.nextHref || '#'}">»</a>
      </div>
    `;
  }
}

export function pagination(props?: PaginationProps): Pagination {
  return new Pagination(props ?? {});
}
