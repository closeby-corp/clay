import { Element, withParent } from '@close-by/clay-core';

export type AspectRatioProps = {
  /** Width / height (default `16 / 9`). */
  ratio?: number;
  className?: string;
};

/** Fixed-ratio wrapper for images, embeds, and dashboard tiles. */
export function aspectRatio(fn: () => void, props?: AspectRatioProps): Element;
export function aspectRatio(props: AspectRatioProps, fn: () => void): Element;
export function aspectRatio(
  propsOrFn: AspectRatioProps | (() => void),
  fnOrProps?: (() => void) | AspectRatioProps,
): Element {
  let props: AspectRatioProps = {};
  let fn: () => void;
  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as AspectRatioProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as () => void;
  }
  const el = new Element('aspectRatio', {
    ratio: props.ratio ?? 16 / 9,
    className: props.className,
  });
  withParent(el, fn);
  return el;
}
