import { Element } from '@clay/core';

export type AiCodeBlockProps = {
  code: string;
  language?: string;
  filename?: string;
  /** Soft streaming cursor affordance (visual only). */
  streaming?: boolean;
  showCopy?: boolean;
  className?: string;
};

/** AI-styled code block (filename + optional streaming cue). */
export function codeBlock(props: AiCodeBlockProps): Element {
  return new Element('aiCodeBlock', {
    code: props.code ?? '',
    language: props.language ?? 'text',
    filename: props.filename,
    streaming: props.streaming ?? false,
    showCopy: props.showCopy !== false,
    className: props.className,
  });
}
