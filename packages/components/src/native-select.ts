import { Element } from '@close-by/clay-core';

export type NativeSelectOption = { value: string; label: string };

export type NativeSelectProps = {
  options: NativeSelectOption[];
  value?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'default';
  className?: string;
  onChange?: (value: string) => void;
};

/** Lightweight styled `<select>` when combobox is overkill. */
export function nativeSelect(props: NativeSelectProps): Element {
  return new Element('nativeSelect', {
    options: props.options,
    value: props.value ?? props.options[0]?.value ?? '',
    label: props.label,
    error: props.error,
    disabled: props.disabled ?? false,
    size: props.size ?? 'default',
    className: props.className,
    onChange: props.onChange,
  });
}
