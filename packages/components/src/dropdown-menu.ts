import { Element, withParent } from '@close-by/clay-core';

export type DropdownMenuVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

export type DropdownMenuProps = {
  label?: string;
  variant?: DropdownMenuVariant;
  className?: string;
};

export type DropdownItemOptions = {
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  onSelect?: () => void | Promise<void>;
};

export class DropdownMenuElement extends Element {
  constructor(props: DropdownMenuProps = {}) {
    super('dropdownmenu', {
      label: props.label ?? 'Menu',
      variant: props.variant ?? 'outline',
      className: props.className,
    });
  }

  item(value: string, label: string, opts: DropdownItemOptions = {}): Element {
    return new Element('dropdownitem', {
      value,
      label,
      variant: opts.variant ?? 'default',
      disabled: opts.disabled ?? false,
      onSelect: opts.onSelect,
    });
  }

  separator(): Element {
    return new Element('dropdownseparator', {});
  }
}

export function dropdownMenu(
  fn: (m: DropdownMenuElement) => void,
  props?: DropdownMenuProps,
): DropdownMenuElement;
export function dropdownMenu(
  props: DropdownMenuProps,
  fn: (m: DropdownMenuElement) => void,
): DropdownMenuElement;
export function dropdownMenu(
  propsOrFn: DropdownMenuProps | ((m: DropdownMenuElement) => void),
  fnOrProps?: ((m: DropdownMenuElement) => void) | DropdownMenuProps,
): DropdownMenuElement {
  let props: DropdownMenuProps = {};
  let fn: (m: DropdownMenuElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as DropdownMenuProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (m: DropdownMenuElement) => void;
  }

  const el = new DropdownMenuElement(props);
  withParent(el, () => fn(el));
  return el;
}
