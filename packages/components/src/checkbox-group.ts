import { Element } from '@close-by/clay-core';

export type CheckboxGroupOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type CheckboxGroupProps = {
  value?: string[];
  label?: string;
  error?: string;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  options: CheckboxGroupOption[];
  className?: string;
  onChange?: (value: string[]) => void | Promise<void>;
};

/** Multi-select checkbox set (permissions, features, tags). */
export function checkboxGroup(props: CheckboxGroupProps): Element {
  return new Element('checkboxGroup', {
    value: props.value ?? [],
    label: props.label,
    error: props.error,
    disabled: props.disabled ?? false,
    orientation: props.orientation ?? 'vertical',
    options: props.options,
    className: props.className,
    onChange: props.onChange,
  });
}
