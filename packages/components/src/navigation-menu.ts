import { Element, withParent } from '@close-by/clay-core';

export type NavigationMenuLinkItem = {
  label: string;
  href?: string;
  description?: string;
  active?: boolean;
  onSelect?: () => void | Promise<void>;
};

export type NavigationMenuProps = {
  className?: string;
  /** When true, submenus use Radix's shared viewport (mega-menu). Default false — inline dropdown. */
  viewport?: boolean;
};

export class NavigationMenuElement extends Element {
  constructor(props: NavigationMenuProps = {}) {
    super('navigationmenu', {
      className: props.className,
      viewport: props.viewport ?? false,
    });
  }

  /** Top-level link (no dropdown). */
  link(label: string, opts: { href?: string; active?: boolean; onSelect?: () => void | Promise<void> } = {}): Element {
    return new Element('navigationmenulink', {
      label,
      href: opts.href,
      active: opts.active ?? false,
      onSelect: opts.onSelect,
    });
  }

  /** Dropdown section with child links. */
  menu(label: string, fn: (m: NavigationMenuSubElement) => void): NavigationMenuSubElement {
    const sub = new NavigationMenuSubElement(label);
    withParent(sub, () => fn(sub));
    return sub;
  }
}

export class NavigationMenuSubElement extends Element {
  constructor(label: string) {
    super('navigationmenusub', { label });
  }

  link(item: NavigationMenuLinkItem): Element {
    return new Element('navigationmenulink', {
      label: item.label,
      href: item.href,
      description: item.description,
      active: item.active ?? false,
      onSelect: item.onSelect,
    });
  }
}

export function navigationMenu(
  fn: (menu: NavigationMenuElement) => void,
  props?: NavigationMenuProps,
): NavigationMenuElement;
export function navigationMenu(
  props: NavigationMenuProps,
  fn: (menu: NavigationMenuElement) => void,
): NavigationMenuElement;
export function navigationMenu(
  propsOrFn: NavigationMenuProps | ((menu: NavigationMenuElement) => void),
  fnOrProps?: ((menu: NavigationMenuElement) => void) | NavigationMenuProps,
): NavigationMenuElement {
  let props: NavigationMenuProps = {};
  let fn: (menu: NavigationMenuElement) => void;
  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as NavigationMenuProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (menu: NavigationMenuElement) => void;
  }
  const el = new NavigationMenuElement(props);
  withParent(el, () => fn(el));
  return el;
}
