import { Component } from '@badui/core';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export class Breadcrumbs extends Component<BreadcrumbsProps> {
  render(): string {
    const classes = ['breadcrumbs', this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');

    const items = this.props.items.map((item) => {
      if (item.href) {
        return `<li><a href="${item.href}">${item.label}</a></li>`;
      }
      return `<li>${item.label}</li>`;
    }).join('');

    return `<div id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}><ul>${items}</ul></div>`;
  }
}

export function breadcrumbs(items: BreadcrumbItem[], props?: Omit<BreadcrumbsProps, 'items'>): Breadcrumbs {
  return new Breadcrumbs({ items, ...props });
}
