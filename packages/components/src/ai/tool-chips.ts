import { Element } from '@close-by/clay-core';
import type { AiToolChip } from './types';

export type AiToolChipsProps = {
  chips?: AiToolChip[];
  summary?: string;
  className?: string;
  onChipClick?: (chipId: string) => void | Promise<void>;
};

export function toolChips(props: AiToolChipsProps = {}): Element {
  return new Element('aiToolChips', {
    chips: props.chips ?? [],
    summary: props.summary,
    className: props.className,
    onChipClick: props.onChipClick,
  });
}
