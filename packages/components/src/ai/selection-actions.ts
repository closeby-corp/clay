import { Element, t } from '@close-by/clay-core';
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
      { id: 'explain', label: t('server.selectionActions.explain') },
      { id: 'improve', label: t('server.selectionActions.improve') },
      { id: 'shorten', label: t('server.selectionActions.shorten') },
      { id: 'tone', label: t('server.selectionActions.tone') },
      { id: 'grammar', label: t('server.selectionActions.grammar') },
    ],
    className: props.className,
    onAction: props.onAction,
  });
}
