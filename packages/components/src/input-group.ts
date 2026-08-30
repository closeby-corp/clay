import { Element } from '@close-by/clay-core';

export type InputGroupProps = {
  value?: string;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  /** Prefix text or icon slot label (e.g. `https://`, `$`). */
  prefix?: string;
  /** Suffix text (e.g. `.com`, `USD`). */
  suffix?: string;
  /** Optional trailing action button label inside the group. */
  buttonLabel?: string;
  className?: string;
  onInput?: (value: string) => void | Promise<void>;
  onButtonClick?: () => void | Promise<void>;
};

/** Input with inline prefix/suffix addons (search bars, URL fields, units). */
export function inputGroup(props: InputGroupProps = {}): Element {
  return new Element('inputGroup', {
    value: props.value ?? '',
    placeholder: props.placeholder,
    label: props.label,
    error: props.error,
    disabled: props.disabled ?? false,
    prefix: props.prefix,
    suffix: props.suffix,
    buttonLabel: props.buttonLabel,
    className: props.className,
    onInput: props.onInput,
    onButtonClick: props.onButtonClick,
  });
}
