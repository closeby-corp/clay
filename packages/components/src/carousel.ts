import { Element, withParent } from '@clay/core';

export type CarouselOrientation = 'horizontal' | 'vertical';

export type CarouselProps = {
  orientation?: CarouselOrientation;
  /** Show previous/next controls (default true). */
  controls?: boolean;
  className?: string;
};

export class CarouselElement extends Element {
  constructor(props: CarouselProps = {}) {
    super('carousel', {
      orientation: props.orientation ?? 'horizontal',
      controls: props.controls ?? true,
      className: props.className,
    });
  }

  slide(fn: () => void): Element {
    const el = new Element('carouselslide', {});
    withParent(el, fn);
    return el;
  }
}

export function carousel(
  fn: (c: CarouselElement) => void,
  props?: CarouselProps,
): CarouselElement;
export function carousel(
  props: CarouselProps,
  fn: (c: CarouselElement) => void,
): CarouselElement;
export function carousel(
  propsOrFn: CarouselProps | ((c: CarouselElement) => void),
  fnOrProps?: ((c: CarouselElement) => void) | CarouselProps,
): CarouselElement {
  let props: CarouselProps = {};
  let fn: (c: CarouselElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as CarouselProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (c: CarouselElement) => void;
  }

  const el = new CarouselElement(props);
  withParent(el, () => fn(el));
  return el;
}
