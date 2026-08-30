import { Element, withParent } from '@close-by/clay-core';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';

export type ButtonGroupProps = {
  orientation?: ButtonGroupOrientation;
  className?: string;
};

/** Visually groups adjacent buttons or controls (segmented actions, view toggles). */
export function buttonGroup(
  fn: () => void,
  props?: ButtonGroupProps,
): Element;
export function buttonGroup(
  props: ButtonGroupProps,
  fn: () => void,
): Element;
export function buttonGroup(
  propsOrFn: ButtonGroupProps | (() => void),
  fnOrProps?: (() => void) | ButtonGroupProps,
): Element {
  let props: ButtonGroupProps = {};
  let fn: () => void;
  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as ButtonGroupProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as () => void;
  }
  const el = new Element('buttonGroup', {
    orientation: props.orientation ?? 'horizontal',
    className: props.className,
  });
  withParent(el, fn);
  return el;
}
