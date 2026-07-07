import { Component } from '@badui/core';

export interface LoadingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent' | 'neutral';
  text?: string;
  variant?: 'spinner' | 'dots' | 'ring' | 'ball' | 'bars' | 'infinity';
}

export class Loading extends Component<LoadingProps> {
  render(): string {
    const spinnerClass = [
      'loading',
      `loading-${this.props.variant || 'spinner'}`,
      this.props.size ? `loading-${this.props.size}` : 'loading-md',
      this.props.color ? `text-${this.props.color}` : ''
    ].filter(Boolean).join(' ');

    return `
      <div id="${this.id}" class="flex items-center gap-2"${this.patchRegionAttr()}${this.getExtraStyles()}>
        <span class="${spinnerClass}"></span>
        ${this.props.text ? `<span>${this.props.text}</span>` : ''}
      </div>
    `;
  }
}

export function loading(props?: LoadingProps): Loading {
  return new Loading(props || {});
}
