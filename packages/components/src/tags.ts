import { Element } from '@clay/core';

export type TagsOption = { value: string; label: string };

export type TagsProps = {
  /** Selected tag values. */
  value?: string[];
  /** Suggested options (shown while typing when set). */
  options?: TagsOption[];
  /** Allow creating tags not in `options` (default true). */
  creatable?: boolean;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string[]) => void;
};

export function tags(props: TagsProps = {}): Element {
  return new Element('tags', {
    value: props.value ?? [],
    options: props.options ?? [],
    creatable: props.creatable !== false,
    label: props.label,
    placeholder: props.placeholder ?? 'Add tag…',
    error: props.error,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}
