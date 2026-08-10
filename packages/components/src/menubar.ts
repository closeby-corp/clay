import { Element, withParent } from '@clay/core';

export type MenubarProps = {
  className?: string;
};

export type MenubarItemOptions = {
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  onSelect?: () => void | Promise<void>;
};

export type MenubarCheckboxOptions = {
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void | Promise<void>;
};

export type MenubarRadioGroupOptions = {
  value?: string;
  onValueChange?: (value: string) => void | Promise<void>;
};

export type MenubarRadioItemOptions = {
  disabled?: boolean;
};

/** Shared item API for top-level menus and nested submenus. */
export class MenubarMenuElement extends Element {
  constructor(label: string, type: 'menubarmenu' | 'menubarsubmenu' = 'menubarmenu') {
    super(type, { label });
  }

  item(value: string, label: string, opts: MenubarItemOptions = {}): Element {
    return new Element('menubaritem', {
      value,
      label,
      variant: opts.variant ?? 'default',
      disabled: opts.disabled ?? false,
      onSelect: opts.onSelect,
    });
  }

  checkbox(value: string, label: string, opts: MenubarCheckboxOptions = {}): Element {
    const el = new Element('menubarcheckbox', {
      value,
      label,
      checked: opts.checked ?? false,
      disabled: opts.disabled ?? false,
      onCheckedChange: opts.onCheckedChange,
    });
    el.on('checkedChange', async (value) => {
      el.update({ checked: !!value });
    });
    return el;
  }

  radioGroup(
    fn: (g: MenubarRadioGroupElement) => void,
    opts?: MenubarRadioGroupOptions,
  ): MenubarRadioGroupElement;
  radioGroup(
    opts: MenubarRadioGroupOptions,
    fn: (g: MenubarRadioGroupElement) => void,
  ): MenubarRadioGroupElement;
  radioGroup(
    optsOrFn: MenubarRadioGroupOptions | ((g: MenubarRadioGroupElement) => void),
    fnOrOpts?: ((g: MenubarRadioGroupElement) => void) | MenubarRadioGroupOptions,
  ): MenubarRadioGroupElement {
    let opts: MenubarRadioGroupOptions = {};
    let fn: (g: MenubarRadioGroupElement) => void;
    if (typeof optsOrFn === 'function') {
      fn = optsOrFn;
      opts = (fnOrOpts as MenubarRadioGroupOptions) ?? {};
    } else {
      opts = optsOrFn;
      fn = fnOrOpts as (g: MenubarRadioGroupElement) => void;
    }
    const group = new MenubarRadioGroupElement(opts);
    withParent(group, () => fn(group));
    return group;
  }

  submenu(label: string, fn: (m: MenubarMenuElement) => void): MenubarMenuElement {
    const sub = new MenubarMenuElement(label, 'menubarsubmenu');
    withParent(sub, () => fn(sub));
    return sub;
  }

  separator(): Element {
    return new Element('menubarseparator', {});
  }
}

export class MenubarRadioGroupElement extends Element {
  constructor(opts: MenubarRadioGroupOptions = {}) {
    super('menubarradiogroup', {
      value: opts.value,
      onValueChange: opts.onValueChange,
    });
    this.on('valueChange', async (value) => {
      this.update({ value: value == null ? undefined : String(value) });
    });
  }

  item(value: string, label: string, opts: MenubarRadioItemOptions = {}): Element {
    return new Element('menubarradioitem', {
      value,
      label,
      disabled: opts.disabled ?? false,
    });
  }
}

export class MenubarElement extends Element {
  constructor(props: MenubarProps = {}) {
    super('menubar', {
      className: props.className,
    });
  }

  menu(label: string, fn: (m: MenubarMenuElement) => void): MenubarMenuElement {
    const menu = new MenubarMenuElement(label);
    withParent(menu, () => fn(menu));
    return menu;
  }
}

export function menubar(
  fn: (m: MenubarElement) => void,
  props?: MenubarProps,
): MenubarElement;
export function menubar(
  props: MenubarProps,
  fn: (m: MenubarElement) => void,
): MenubarElement;
export function menubar(
  propsOrFn: MenubarProps | ((m: MenubarElement) => void),
  fnOrProps?: ((m: MenubarElement) => void) | MenubarProps,
): MenubarElement {
  let props: MenubarProps = {};
  let fn: (m: MenubarElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as MenubarProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (m: MenubarElement) => void;
  }

  const el = new MenubarElement(props);
  withParent(el, () => fn(el));
  return el;
}
