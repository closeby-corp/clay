import { Component } from '@badui/core';

export type MaskShape = 'squircle' | 'heart' | 'hexagon' | 'hexagon-2' | 'decagon' | 'pentagon' | 'diamond' | 'square' | 'circle' | 'parallelogram' | 'parallelogram-2' | 'parallelogram-3' | 'parallelogram-4' | 'star' | 'star-2' | 'triangle' | 'triangle-2' | 'triangle-3' | 'triangle-4';

export interface MaskProps {
  src: string;
  alt?: string;
  shape?: MaskShape;
  className?: string;
}

export class Mask extends Component<MaskProps> {
  render(): string {
    const shapeClass = this.props.shape ? `mask-${this.props.shape}` : 'mask-squircle';
    const classes = ['mask', shapeClass, 'w-24', this.props.className || '', this.getExtraClasses().trim()].filter(Boolean).join(' ');

    return `<img id="${this.id}" class="${classes}" src="${this.props.src}" alt="${this.props.alt || ''}"${this.getExtraStyles()} />`;
  }
}

export function mask(src: string, props?: Omit<MaskProps, 'src'>): Mask {
  return new Mask({ src, ...props });
}
