import { Element } from '@close-by/clay-core';

export type CodeBlockProps = {
  /** Source code to display (read-only). */
  code: string;
  /** Language id for Shiki (e.g. `ts`, `tsx`, `bash`). */
  language?: string;
  /** Show a copy button (default true). Ignored when `sensitive` until revealed. */
  showCopy?: boolean;
  /**
   * Treat body as possibly secret (API keys, tokens in logs). Client blurs content
   * until the user clicks Reveal; scrubbing remains the app’s job.
   */
  sensitive?: boolean;
  className?: string;
};

export function codeBlock(props: CodeBlockProps): Element {
  return new Element('codeBlock', {
    code: props.code ?? '',
    language: props.language ?? 'text',
    showCopy: props.showCopy !== false,
    sensitive: props.sensitive === true,
    className: props.className,
  });
}
