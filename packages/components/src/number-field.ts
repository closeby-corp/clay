import { Element } from '@close-by/clay-core';

export type NumberFieldProps = {
  value?: number;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  /** Decimal places for display/input rounding. */
  precision?: number;
  className?: string;
  onChange?: (value: number) => void;
};

/** Numeric input with increment/decrement steppers. */
export function numberField(props: NumberFieldProps = {}): Element {
  return new Element('numberField', {
    value: props.value ?? 0,
    label: props.label,
    placeholder: props.placeholder,
    error: props.error,
    disabled: props.disabled ?? false,
    min: props.min,
    max: props.max,
    step: props.step ?? 1,
    precision: props.precision,
    className: props.className,
    onChange: props.onChange,
  });
}
