import { Element } from '@close-by/clay-core';
import type { AiSelectionAction } from './types';

export type AiSelectionActionsProps = {
  /** Highlighted passage text (selection comes from props). */
  selection: string;
  actions?: AiSelectionAction[];
  className?: string;
  onAction?: (actionId: string) => void | Promise<void>;
};

export function selectionActions(props: AiSelectionActionsProps): Element {
  return new Element('aiSelectionActions', {
    selection: props.selection,
    actions: props.actions ?? [
      { id: 'explain', label: 'Explain' },
      { id: 'improve', label: 'Improve' },
      { id: 'shorten', label: 'Shorten' },
      { id: 'tone', label: 'Tone' },
      { id: 'grammar', label: 'Grammar' },
    ],
    className: props.className,
    onAction: props.onAction,
  });
}
