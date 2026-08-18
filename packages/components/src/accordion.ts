import { Element, withParent } from '@close-by/clay-core';

export type AccordionType = 'single' | 'multiple';

export type AccordionProps = {
  /** `'single'` (default) or `'multiple'` open panels. */
  type?: AccordionType;
  /**
   * Open panel value(s). Single → string; multiple → string[].
   * Defaults to the first item when `type` is `'single'`.
   */
  value?: string | string[];
  /** When `type` is `'single'`, whether the open item can be collapsed. */
  collapsible?: boolean;
  className?: string;
  onChange?: (value: string | string[]) => void;
};

export type AccordionItemOptions = {
  className?: string;
};

export class AccordionElement extends Element {
  constructor(props: AccordionProps = {}) {
    super('accordion', {
      type: props.type ?? 'single',
      value: props.value ?? (props.type === 'multiple' ? [] : ''),
      collapsible: props.collapsible ?? true,
      className: props.className,
      onChange: props.onChange,
    });
  }

  /**
   * Add an accordion panel.
   * - `item(value, fn)` — title defaults to `value`
   * - `item(value, title, fn)` — explicit title
   */
  item(value: string, fn: () => void, opts?: AccordionItemOptions): Element;
  item(value: string, title: string, fn: () => void, opts?: AccordionItemOptions): Element;
  item(
    value: string,
    titleOrFn: string | (() => void),
    fnOrOpts?: (() => void) | AccordionItemOptions,
    opts?: AccordionItemOptions,
  ): Element {
    let title: string;
    let fn: () => void;
    let options: AccordionItemOptions = {};

    if (typeof titleOrFn === 'function') {
      title = value;
      fn = titleOrFn;
      options = (fnOrOpts as AccordionItemOptions | undefined) ?? {};
    } else {
      title = titleOrFn;
      fn = fnOrOpts as () => void;
      options = opts ?? {};
    }

    const panel = new Element('accordionitem', {
      value,
      title,
      className: options.className,
    });
    withParent(panel, fn);
    return panel;
  }
}

export function accordion(fn: (a: AccordionElement) => void, props?: AccordionProps): AccordionElement;
export function accordion(props: AccordionProps, fn: (a: AccordionElement) => void): AccordionElement;
export function accordion(
  propsOrFn: AccordionProps | ((a: AccordionElement) => void),
  fnOrProps?: ((a: AccordionElement) => void) | AccordionProps,
): AccordionElement {
  let props: AccordionProps = {};
  let fn: (a: AccordionElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as AccordionProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (a: AccordionElement) => void;
  }

  const el = new AccordionElement(props);
  withParent(el, () => fn(el));

  const type = (el.props.type as AccordionType) ?? 'single';
  if (type === 'single') {
    if (!el.props.value && el.children.length > 0) {
      el.props.value = el.children[0]!.props.value ?? '';
    }
  } else if (!Array.isArray(el.props.value)) {
    el.props.value = el.props.value ? [String(el.props.value)] : [];
  }

  return el;
}
