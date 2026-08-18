import { Element } from '@close-by/clay-core';

export type ColorPickerProps = {
  /** Hex color string (e.g. `#3b82f6`). */
  value?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
};

export function colorPicker(props: ColorPickerProps = {}): Element {
  return new Element('colorPicker', {
    value: props.value ?? '#3b82f6',
    label: props.label,
    error: props.error,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}
