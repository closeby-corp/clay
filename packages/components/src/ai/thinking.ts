import { Element } from '@clay/core';
import type { AiThinkingStep } from './types';

export type AiThinkingProps = {
  /** Section title when collapsed (default "Thinking"). */
  title?: string;
  steps?: AiThinkingStep[];
  /** Start expanded. */
  open?: boolean;
  className?: string;
  onToggle?: (open: boolean) => void | Promise<void>;
};

export function thinking(props: AiThinkingProps = {}): Element {
  return new Element('aiThinking', {
    title: props.title ?? 'Thinking',
    steps: props.steps ?? [],
    open: props.open ?? false,
    className: props.className,
    onToggle: props.onToggle,
  });
}
