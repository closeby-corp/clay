import { Element, withParent } from '@badui/core';

export type TabsProps = {
  /** Active tab value (server-owned). Defaults to the first panel. */
  value?: string;
  className?: string;
  onChange?: (value: string) => void;
};

export type TabPanelOptions = {
  icon?: string;
  className?: string;
};

export class TabsElement extends Element {
  constructor(props: TabsProps = {}) {
    super('tabs', {
      value: props.value ?? '',
      className: props.className,
      onChange: props.onChange,
    });
  }

  /**
   * Add a tab panel.
   * - `tab(value, fn)` — label defaults to `value`
   * - `tab(value, label, fn)` — explicit label
   */
  tab(value: string, fn: () => void, opts?: TabPanelOptions): Element;
  tab(value: string, label: string, fn: () => void, opts?: TabPanelOptions): Element;
  tab(
    value: string,
    labelOrFn: string | (() => void),
    fnOrOpts?: (() => void) | TabPanelOptions,
    opts?: TabPanelOptions,
  ): Element {
    let label: string;
    let fn: () => void;
    let options: TabPanelOptions = {};

    if (typeof labelOrFn === 'function') {
      label = value;
      fn = labelOrFn;
      options = (fnOrOpts as TabPanelOptions | undefined) ?? {};
    } else {
      label = labelOrFn;
      fn = fnOrOpts as () => void;
      options = opts ?? {};
    }

    const panel = new Element('tab', {
      value,
      label,
      icon: options.icon,
      className: options.className,
    });
    withParent(panel, fn);
    return panel;
  }
}

export function tabs(fn: (t: TabsElement) => void, props?: TabsProps): TabsElement;
export function tabs(props: TabsProps, fn: (t: TabsElement) => void): TabsElement;
export function tabs(
  propsOrFn: TabsProps | ((t: TabsElement) => void),
  fnOrProps?: ((t: TabsElement) => void) | TabsProps,
): TabsElement {
  let props: TabsProps = {};
  let fn: (t: TabsElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as TabsProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (t: TabsElement) => void;
  }

  const el = new TabsElement(props);
  withParent(el, () => fn(el));

  if (!el.props.value && el.children.length > 0) {
    el.props.value = el.children[0]!.props.value ?? '';
  }

  return el;
}
