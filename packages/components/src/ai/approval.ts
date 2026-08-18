import { Element } from '@close-by/clay-core';
import type { AiApprovalOption } from './types';

export type AiApprovalProps = {
  title?: string;
  question: string;
  options?: AiApprovalOption[];
  /** Allow free-text decline / custom answer. */
  allowCustom?: boolean;
  className?: string;
  onApprove?: (optionId: string) => void | Promise<void>;
  onReject?: () => void | Promise<void>;
};

export function approval(props: AiApprovalProps): Element {
  return new Element('aiApproval', {
    title: props.title ?? 'Needs approval',
    question: props.question,
    options: props.options ?? [],
    allowCustom: props.allowCustom ?? false,
    className: props.className,
    onApprove: props.onApprove,
    onReject: props.onReject,
  });
}
