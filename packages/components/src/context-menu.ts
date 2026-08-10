import { Element, withParent } from '@clay/core';

export type ContextMenuProps = {
  /** Visible label on the trigger (default: right-click target text). */
  label?: string;
  className?: string;
};

export type ContextMenuItemOptions = {
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  onSelect?: () => void | Promise<void>;
};

export class ContextMenuElement extends Element {
  constructor(props: ContextMenuProps = {}) {
    super('contextmenu', {
      label: props.label ?? 'Right-click me',
      className: props.className,
    });
  }

  item(value: string, label: string, opts: ContextMenuItemOptions = {}): Element {
    return new Element('contextmenuitem', {
      value,
      label,
      variant: opts.variant ?? 'default',
      disabled: opts.disabled ?? false,
      onSelect: opts.onSelect,
    });
  }

  separator(): Element {
    return new Element('contextmenuseparator', {});
  }
}

export function contextMenu(
  fn: (m: ContextMenuElement) => void,
  props?: ContextMenuProps,
): ContextMenuElement;
export function contextMenu(
  props: ContextMenuProps,
  fn: (m: ContextMenuElement) => void,
): ContextMenuElement;
export function contextMenu(
  propsOrFn: ContextMenuProps | ((m: ContextMenuElement) => void),
  fnOrProps?: ((m: ContextMenuElement) => void) | ContextMenuProps,
): ContextMenuElement {
  let props: ContextMenuProps = {};
  let fn: (m: ContextMenuElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as ContextMenuProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (m: ContextMenuElement) => void;
  }

  const el = new ContextMenuElement(props);
  withParent(el, () => fn(el));
  return el;
}
