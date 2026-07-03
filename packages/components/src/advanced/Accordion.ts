import { Component } from '@badui/core';

export interface AccordionItem {
  title: string;
  content: string;
  open?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  radio?: boolean;
  arrow?: boolean;
  className?: string;
}

export class Accordion extends Component<AccordionProps> {
  render(): string {
    const name = `${this.id}-accordion`;
    const arrowClass = this.props.arrow !== false ? 'collapse-arrow' : '';

    const items = this.props.items.map((item, i) => {
      const inputType = this.props.radio ? 'radio' : 'checkbox';
      const checked = item.open ? 'checked' : '';
      return `
        <div class="collapse ${arrowClass} bg-base-100 border border-base-300">
          <input type="${inputType}" name="${name}" ${checked} />
          <div class="collapse-title font-semibold">${item.title}</div>
          <div class="collapse-content text-sm">${item.content}</div>
        </div>
      `;
    }).join('');

    return `<div id="${this.id}" class="${this.props.className || ''}${this.getExtraClasses()}">${items}</div>`;
  }
}

export function accordion(items: AccordionItem[], props?: Omit<AccordionProps, 'items'>): Accordion {
  return new Accordion({ items, ...props });
}
