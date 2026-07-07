import { Component } from '@badui/core';

export interface TextRotateProps {
  texts: string[];
  className?: string;
}

export class TextRotate extends Component<TextRotateProps> {
  render(): string {
    const classes = ['text-rotate', this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');
    const spans = this.props.texts.map((t) => `<span>${t}</span>`).join('');

    return `<span id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}><span class="text-rotate-inner">${spans}</span></span>`;
  }
}

export function textRotate(texts: string[], props?: Omit<TextRotateProps, 'texts'>): TextRotate {
  return new TextRotate({ texts, ...props });
}
