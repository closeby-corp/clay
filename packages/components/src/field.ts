import { Element, withParent } from '@close-by/clay-core';

export type FieldOrientation = 'vertical' | 'horizontal' | 'responsive';

export type FieldProps = {
  label?: string;
  description?: string;
  error?: string;
  orientation?: FieldOrientation;
  className?: string;
};

/**
 * Label + description + error wrapper for a single control.
 * Put `ui.input`, `ui.select`, etc. in the callback.
 */
export function field(
  fn: () => void,
  props?: FieldProps,
): Element;
export function field(
  props: FieldProps,
  fn: () => void,
): Element;
export function field(
  propsOrFn: FieldProps | (() => void),
  fnOrProps?: (() => void) | FieldProps,
): Element {
  let props: FieldProps = {};
  let fn: () => void;
  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as FieldProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as () => void;
  }
  const el = new Element('field', {
    label: props.label ?? '',
    description: props.description ?? '',
    error: props.error ?? '',
    orientation: props.orientation ?? 'vertical',
    className: props.className,
  });
  withParent(el, fn);
  return el;
}
