import { Element } from '@badui/core';

export type KanbanCard = {
  id: string;
  title: string;
  description?: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

export type KanbanCardMovePayload = {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  index: number;
};

export type KanbanProps = {
  columns: KanbanColumn[];
  disabled?: boolean;
  className?: string;
  onCardMove?: (payload: KanbanCardMovePayload) => void;
  onCardClick?: (cardId: string) => void;
};

export function kanban(props: KanbanProps): Element {
  return new Element('kanban', {
    columns: props.columns ?? [],
    disabled: props.disabled ?? false,
    className: props.className,
    onCardMove: props.onCardMove,
    onCardClick: props.onCardClick,
  });
}
