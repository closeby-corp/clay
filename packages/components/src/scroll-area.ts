import { Element, withParent } from '@close-by/clay-core';

export type ScrollAreaProps = {
  className?: string;
  /**
   * Fired when the user scrolls near the bottom of the viewport (load-more /
   * infinite scroll). Re-arms after they scroll away from the bottom.
   * Client emits event type `nearEnd`.
   */
  onNearEnd?: () => void | Promise<void>;
  /**
   * Distance from the bottom (px) that counts as “near end”. Default `80`.
   */
  nearEndThreshold?: number;
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
    nearEndThreshold: props.nearEndThreshold,
    onNearEnd: props.onNearEnd,
  });
  withParent(el, fn);
  return el;
}
