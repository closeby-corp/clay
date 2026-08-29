import { Element, withParent } from '@close-by/clay-core';

export type ViewportEnterProps = {
  className?: string;
  /**
   * Fired when this element intersects the viewport.
   * Client emits event type `enter`.
   */
  onEnter?: () => void | Promise<void>;
  /**
   * Fire only the first time it enters view (default `true`).
   * When `false`, fires again after it leaves and re-enters.
   */
  once?: boolean;
  /** IntersectionObserver `rootMargin` (e.g. `'100px'`). */
  rootMargin?: string;
  /** IntersectionObserver `threshold` (0–1 or array). Default `0`. */
  threshold?: number | number[];
};

/**
 * Wrapper that observes visibility via IntersectionObserver.
 * Use for lazy load / one-shot refresh when scrolled into view.
 */
export function viewportEnter(fn: () => void, props?: ViewportEnterProps): Element;
export function viewportEnter(props: ViewportEnterProps, fn: () => void): Element;
export function viewportEnter(
  propsOrFn: ViewportEnterProps | (() => void),
  fnOrProps?: (() => void) | ViewportEnterProps,
): Element {
  let props: ViewportEnterProps = {};
  let fn: () => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as ViewportEnterProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as () => void;
  }

  const el = new Element('viewportEnter', {
    className: props.className,
    once: props.once ?? true,
    rootMargin: props.rootMargin,
    threshold: props.threshold,
    onEnter: props.onEnter,
  });
  withParent(el, fn);
  return el;
}
