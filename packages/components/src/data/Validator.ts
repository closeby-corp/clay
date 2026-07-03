import { Component } from '@badui/core';

export interface ValidatorProps {
  hint?: string;
  error?: string;
  success?: string;
  className?: string;
}

export class Validator extends Component<ValidatorProps> {
  render(): string {
    const classes = ['validator', this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');

    return `
      <div id="${this.id}" class="${classes}"${this.getExtraStyles()}>
        ${this.renderChildren()}
        ${this.props.hint ? `<p class="validator-hint">${this.props.hint}</p>` : ''}
        ${this.props.error ? `<p class="text-error text-sm">${this.props.error}</p>` : ''}
        ${this.props.success ? `<p class="text-success text-sm">${this.props.success}</p>` : ''}
      </div>
    `;
  }
}

export function validator(childrenFn: (v: Validator) => void, props?: ValidatorProps): Validator {
  const instance = new Validator(props ?? {});
  childrenFn(instance);
  return instance;
}
