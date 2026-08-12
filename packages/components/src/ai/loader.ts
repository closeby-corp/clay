import { Element } from '@clay/core';

export type AiLoaderVariant = 'drive' | 'dots' | 'orbit' | 'pixel';

export type AiLoaderProps = {
  /** Short status label (e.g. "Churning"). */
  label?: string;
  variant?: AiLoaderVariant;
  /** ISO / epoch ms — client may show elapsed from this. */
  startedAt?: string | number;
  className?: string;
};

export function loader(props: AiLoaderProps = {}): Element {
  return new Element('aiLoader', {
    label: props.label ?? 'Working',
    variant: props.variant ?? 'dots',
    startedAt: props.startedAt,
    className: props.className,
  });
}
