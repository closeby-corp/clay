import { Element } from '@clay/core';
import type { AiRecommendationAlternative } from './types';

export type AiRecommendationProps = {
  title?: string;
  body: string;
  confidence?: number;
  confidenceLabel?: string;
  alternatives?: AiRecommendationAlternative[];
  acceptLabel?: string;
  className?: string;
  onAccept?: () => void | Promise<void>;
  onReject?: () => void | Promise<void>;
  onAlternative?: (id: string) => void | Promise<void>;
};

export function recommendation(props: AiRecommendationProps): Element {
  return new Element('aiRecommendation', {
    title: props.title ?? 'Recommendation',
    body: props.body,
    confidence: props.confidence,
    confidenceLabel: props.confidenceLabel,
    alternatives: props.alternatives ?? [],
    acceptLabel: props.acceptLabel ?? 'Accept',
    className: props.className,
    onAccept: props.onAccept,
    onReject: props.onReject,
    onAlternative: props.onAlternative,
  });
}
