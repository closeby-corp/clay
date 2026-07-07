import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from '../layouts/build';

export interface FieldsetProps {
  legend?: string;
  className?: string;
}

const FIELDSET_KEYS = new Set(['legend', 'className']);

export class Fieldset extends Component<FieldsetProps> {
  constructor(props: FieldsetProps = {}) {
    super(props, []);
  }

  render(): string {
    const classes = ['fieldset', 'bg-base-200', 'border-base-300', 'rounded-box', 'w-xs', 'border', 'p-4', this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    return `
      <fieldset id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>
        ${this.props.legend ? `<legend class="fieldset-legend">${this.props.legend}</legend>` : ''}
        ${this.renderChildren()}
      </fieldset>
    `;
  }
}

export function fieldset(childrenFn: (f: Fieldset) => void, props?: FieldsetProps): Fieldset;
export function fieldset(...args: (LayoutChild | FieldsetProps)[]): Fieldset;
export function fieldset(...args: unknown[]): Fieldset {
  return buildLayout(Fieldset, FIELDSET_KEYS, ...args);
}
