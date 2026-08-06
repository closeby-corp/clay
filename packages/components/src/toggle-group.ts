import { Element, withParent } from '@badui/core';

export type ToggleGroupType = 'single' | 'multiple';
export type ToggleGroupVariant = 'default' | 'outline';
export type ToggleGroupSize = 'default' | 'sm' | 'lg';

export type ToggleGroupProps = {
  type?: ToggleGroupType;
  /** Selected value(s): string for single, string[] for multiple. */
  value?: string | string[];
  variant?: ToggleGroupVariant;
  size?: ToggleGroupSize;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string | string[]) => void | Promise<void>;
};

export type ToggleItemOptions = {
  disabled?: boolean;
};

export class ToggleGroupElement extends Element {
  constructor(props: ToggleGroupProps = {}) {
    const type = props.type ?? 'single';
    super('togglegroup', {
      type,
      value: props.value ?? (type === 'multiple' ? [] : ''),
      variant: props.variant ?? 'default',
      size: props.size ?? 'default',
      disabled: props.disabled ?? false,
      className: props.className,
      onChange: props.onChange,
    });
  }

  item(value: string, label: string, opts: ToggleItemOptions = {}): Element {
    return new Element('toggleitem', {
      value,
      label,
      disabled: opts.disabled ?? false,
    });
  }
}

export function toggleGroup(
  fn: (g: ToggleGroupElement) => void,
  props?: ToggleGroupProps,
): ToggleGroupElement;
export function toggleGroup(
  props: ToggleGroupProps,
  fn: (g: ToggleGroupElement) => void,
): ToggleGroupElement;
export function toggleGroup(
  propsOrFn: ToggleGroupProps | ((g: ToggleGroupElement) => void),
  fnOrProps?: ((g: ToggleGroupElement) => void) | ToggleGroupProps,
): ToggleGroupElement {
  let props: ToggleGroupProps = {};
  let fn: (g: ToggleGroupElement) => void;

  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as ToggleGroupProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as (g: ToggleGroupElement) => void;
  }

  const el = new ToggleGroupElement(props);
  withParent(el, () => fn(el));
  return el;
}
