import { getCurrentSession } from './context';

export type ScrollBehavior = 'auto' | 'smooth';

export type ScrollToOptions = {
  /** Pixel offset from the top, or `top` / `bottom` shortcuts. */
  top?: number | 'top' | 'bottom';
  left?: number;
  behavior?: ScrollBehavior;
};

export type ScrollIntoViewOptions = {
  behavior?: ScrollBehavior;
  block?: 'start' | 'center' | 'end' | 'nearest';
  inline?: 'start' | 'center' | 'end' | 'nearest';
};

/**
 * Run a JavaScript snippet in the connected browser.
 * Intended for trusted server-authored code (NiceGUI-style escape hatch).
 */
export function runJavaScript(code: string): void {
  const session = getCurrentSession();
  if (!session) return;
  session.runJavaScript(code);
}

/** Scroll the window (or document scrolling element). */
export function scrollTo(options: ScrollToOptions = {}): void {
  const session = getCurrentSession();
  if (!session) return;
  session.scrollTo(options);
}

/** Scroll the first matching element into view (`document.querySelector`). */
export function scrollIntoView(
  selector: string,
  options: ScrollIntoViewOptions = {},
): void {
  const session = getCurrentSession();
  if (!session) return;
  session.scrollIntoView(selector, options);
}

export const scroll = {
  to: scrollTo,
  intoView: scrollIntoView,
};
