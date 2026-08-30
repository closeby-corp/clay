import { Element, withParent } from '@close-by/clay-core';

export type FilterChip = {
  id: string;
  label: string;
  /** Muted detail after the label (e.g. filter value). */
  value?: string;
};

export type FilterBarProps = {
  chips?: FilterChip[];
  /** Label for the clear-all control. Default `Clear all`. */
  clearLabel?: string;
  className?: string;
  onClear?: () => void | Promise<void>;
  onRemoveChip?: (chipId: string) => void | Promise<void>;
};

/**
 * Toolbar row for ops filters: active chips, clear-all, and a slot for controls
 * (`select`, `combobox`, `dateRange`, etc.).
 */
export function filterBar(
  fn: () => void,
  props?: FilterBarProps,
): Element;
export function filterBar(
  props: FilterBarProps,
  fn: () => void,
): Element;
export function filterBar(
  propsOrFn: FilterBarProps | (() => void),
  fnOrProps?: (() => void) | FilterBarProps,
): Element {
  let props: FilterBarProps = {};
  let fn: () => void;
  if (typeof propsOrFn === 'function') {
    fn = propsOrFn;
    props = (fnOrProps as FilterBarProps) ?? {};
  } else {
    props = propsOrFn;
    fn = fnOrProps as () => void;
  }
  const el = new Element('filterBar', {
    chips: props.chips ?? [],
    clearLabel: props.clearLabel ?? 'Clear all',
    className: props.className,
    onClear: props.onClear,
    onRemoveChip: props.onRemoveChip,
  });
  withParent(el, fn);
  return el;
}

/** Removable filter chips without the full filter bar chrome. */
export function filterChips(props: {
  chips: FilterChip[];
  clearLabel?: string;
  className?: string;
  onClear?: () => void | Promise<void>;
  onRemoveChip?: (chipId: string) => void | Promise<void>;
}): Element {
  return new Element('filterChips', {
    chips: props.chips,
    clearLabel: props.clearLabel ?? 'Clear all',
    className: props.className,
    onClear: props.onClear,
    onRemoveChip: props.onRemoveChip,
  });
}
