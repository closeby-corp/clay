import { Component } from '@badui/core';
import { buildLayout, type LayoutChild } from '../layouts/build';

export interface CarouselProps {
  snap?: 'start' | 'center' | 'end';
  vertical?: boolean;
  className?: string;
}

const CAROUSEL_KEYS = new Set(['snap', 'vertical', 'className']);

export class Carousel extends Component<CarouselProps> {
  constructor(props: CarouselProps = {}) {
    super(props, []);
  }

  render(): string {
    const snapClass = this.props.snap ? `carousel-${this.props.snap}` : 'carousel-center';
    const vertClass = this.props.vertical ? 'carousel-vertical' : '';
    const classes = ['carousel', snapClass, vertClass, 'rounded-box', this.props.className || '', this.getExtraClasses().trim()]
      .filter(Boolean).join(' ');

    return `<div id="${this.id}" class="${classes}"${this.patchRegionAttr()}${this.getExtraStyles()}>${this.renderChildren()}</div>`;
  }
}

export function carousel(childrenFn: (c: Carousel) => void, props?: CarouselProps): Carousel;
export function carousel(...args: (LayoutChild | CarouselProps)[]): Carousel;
export function carousel(...args: unknown[]): Carousel {
  return buildLayout(Carousel, CAROUSEL_KEYS, ...args);
}
