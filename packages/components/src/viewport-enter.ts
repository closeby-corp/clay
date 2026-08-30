import { Element, withParent } from '@close-by/clay-core';

export type ViewportEnterRoot = 'viewport' | 'nearest-scroll' | (string & {});

export type ViewportEnterProps = {
  className?: string;
  /**
   * Fired when this element intersects the viewport (or scroll root).
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
  /**
   * Scroll root for IntersectionObserver:
   * - `'viewport'` (default) — browser viewport (`root: null`)
   * - `'nearest-scroll'` — closest overflow scroll ancestor (or scroll-area viewport)
   * - CSS selector — `document.querySelector` / `element.closest`
   */
  root?: ViewportEnterRoot;
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
    root: props.root ?? 'viewport',
    onEnter: props.onEnter,
  });
  withParent(el, fn);
  return el;
}
