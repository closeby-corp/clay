import { Element } from '@clay/core';

export type RatingProps = {
  /** Current rating (0 = none). */
  value?: number;
  /** Maximum stars (default 5). */
  max?: number;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: number) => void;
};

export function rating(props: RatingProps = {}): Element {
  const max = Math.max(1, Math.floor(props.max ?? 5));
  const value = Math.min(max, Math.max(0, Number(props.value ?? 0)));
  return new Element('rating', {
    value,
    max,
    label: props.label,
    error: props.error,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}
