import { Element, withParent } from '@clay/core';

export type CollapsibleProps = {
  /** Trigger label. */
  title?: string;
  /** Whether content is expanded (stored as element `value` for bindValue). */
  open?: boolean;
  className?: string;
  onChange?: (open: boolean) => void;
};

export class CollapsibleElement extends Element {
  constructor(props: CollapsibleProps = {}) {
    super('collapsible', {
      title: props.title ?? 'Toggle',
      value: props.open ?? false,
      className: props.className,
      onChange: props.onChange,
    });
  }

  setOpen(open: boolean): this {
    if (this.props.value === open) return this;
    this.update({ value: open });
    return this;
  }

  open(): this {
    return this.setOpen(true);
  }

  close(): this {
    return this.setOpen(false);
  }
}

export function collapsible(
  fn: (c: CollapsibleElement) => void,
  props?: CollapsibleProps,
): CollapsibleElement;
export function collapsible(
  props: CollapsibleProps,
  fn: (c: CollapsibleElement) => void,
): CollapsibleElement;
export function collapsible(
  propsOrFn: CollapsibleProps | ((c: CollapsibleElement) => void),
  fnOrProps?: ((c: CollapsibleElement) => void) | CollapsibleProps,
): CollapsibleElement {
  let props: CollapsibleProps = {};
  let fn: (c: CollapsibleElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as CollapsibleProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (c: CollapsibleElement) => void;
  }

  const el = new CollapsibleElement(props);
  withParent(el, () => fn(el));
  return el;
}
