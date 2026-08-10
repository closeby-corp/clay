import { Element } from '@clay/core';

export type EditorFormat = 'html' | 'markdown';

export type EditorProps = {
  /** Document value — HTML string or Markdown depending on `format`. */
  value?: string;
  /** Wire format for `value` / `change` (default `'html'`). */
  format?: EditorFormat;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
};

export function editor(props: EditorProps = {}): Element {
  const format: EditorFormat = props.format === 'markdown' ? 'markdown' : 'html';
  return new Element('editor', {
    value: props.value ?? '',
    format,
    placeholder: props.placeholder,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}
