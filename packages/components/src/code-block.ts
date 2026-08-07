import { Element } from '@badui/core';

export type CodeBlockProps = {
  /** Source code to display (read-only). */
  code: string;
  /** Language id for Shiki (e.g. `ts`, `tsx`, `bash`). */
  language?: string;
  /** Show a copy button (default true). */
  showCopy?: boolean;
  className?: string;
};

export function codeBlock(props: CodeBlockProps): Element {
  return new Element('codeBlock', {
    code: props.code ?? '',
    language: props.language ?? 'text',
    showCopy: props.showCopy !== false,
    className: props.className,
  });
}
