import { Element, withParent } from '@badui/core';

export type ScrollAreaProps = {
  className?: string;
};

/**
 * Scrollable viewport wrapping builder children (ShadCN ScrollArea).
 */
export function scrollArea(fn: () => void, props?: ScrollAreaProps): Element;
export function scrollArea(props: ScrollAreaProps, fn: () => void): Element;
export function scrollArea(
  propsOrFn: ScrollAreaProps | (() => void),
  fnOrProps?: (() => void) | ScrollAreaProps,
): Element {
  let props: ScrollAreaProps = {};
  let fn: () => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as ScrollAreaProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as () => void;
  }

  const el = new Element('scrollarea', {
    className: props.className,
  });
  withParent(el, fn);
  return el;
}
