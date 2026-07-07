import { Component } from '@badui/core';

export interface FilterOption {
  label: string;
  value: string;
  active?: boolean;
}

export interface FilterProps {
  options: FilterOption[];
  form?: boolean;
  className?: string;
}

export class Filter extends Component<FilterProps> {
  render(): string {
    const tag = this.props.form ? 'form' : 'div';
    const classes = ['filter', this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');

    const buttons = this.props.options.map((opt) => {
      const active = opt.active ? 'filter-active' : '';
      return `<input class="btn ${active}" type="radio" name="${this.id}-filter" aria-label="${opt.label}" value="${opt.value}" />`;
    }).join('');

    return `<${tag} id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>${buttons}</${tag}>`;
  }
}

export function filter(options: FilterOption[], props?: Omit<FilterProps, 'options'>): Filter {
  return new Filter({ options, ...props });
}
