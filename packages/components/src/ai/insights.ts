import { Element } from '@clay/core';
import type { AiInsight } from './types';

export type AiInsightsProps = {
  title?: string;
  insights?: AiInsight[];
  /** Controlled page index (0-based). */
  index?: number;
  prompt?: string;
  className?: string;
  onIndexChange?: (index: number) => void | Promise<void>;
  onPrompt?: () => void | Promise<void>;
};

export function insights(props: AiInsightsProps = {}): Element {
  return new Element('aiInsights', {
    title: props.title ?? 'Insights',
    insights: props.insights ?? [],
    index: props.index ?? 0,
    prompt: props.prompt,
    className: props.className,
    onIndexChange: props.onIndexChange,
    onPrompt: props.onPrompt,
  });
}
