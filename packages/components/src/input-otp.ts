import { Element } from '@badui/core';

export type InputOtpProps = {
  /** Number of digit slots (default 6). */
  length?: number;
  value?: string;
  disabled?: boolean;
  className?: string;
  /** Fired when the full code is entered (or on each change if partial). */
  onChange?: (value: string) => void | Promise<void>;
  /** Fired when all slots are filled. */
  onComplete?: (value: string) => void | Promise<void>;
};

export function inputOtp(props: InputOtpProps = {}): Element {
  const length = Math.max(1, Math.min(12, props.length ?? 6));
  return new Element('inputotp', {
    length,
    value: props.value ?? '',
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
    onComplete: props.onComplete,
  });
}
