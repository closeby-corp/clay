import { Element } from '@close-by/clay-core';

export type DateRangePreset = {
  label: string;
  /** ISO `YYYY-MM-DD` */
  from: string;
  /** ISO `YYYY-MM-DD` */
  to: string;
};

export type DateRangeProps = {
  /** ISO start date (`YYYY-MM-DD`) or empty. */
  from?: string;
  /** ISO end date (`YYYY-MM-DD`) or empty. */
  to?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Quick ranges shown above the calendar. */
  presets?: DateRangePreset[];
  className?: string;
  onChange?: (range: { from: string; to: string }) => void;
};

/** Date range picker with optional preset shortcuts. Values are ISO `YYYY-MM-DD`. */
export function dateRange(props: DateRangeProps = {}): Element {
  return new Element('dateRange', {
    from: props.from ?? '',
    to: props.to ?? '',
    label: props.label,
    placeholder: props.placeholder ?? 'Pick a date range',
    error: props.error,
    disabled: props.disabled ?? false,
    presets: props.presets,
    className: props.className,
    onChange: props.onChange,
  });
}
