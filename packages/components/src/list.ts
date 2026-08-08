import { Element } from '@badui/core';

export type ListItem = {
  id: string;
  title: string;
  description?: string;
};

export type ListGroup = {
  id: string;
  title: string;
  items: ListItem[];
};

export type ListItemMovePayload = {
  itemId: string;
  fromGroupId: string;
  toGroupId: string;
  index: number;
};

export type ListProps = {
  groups: ListGroup[];
  disabled?: boolean;
  className?: string;
  onItemMove?: (payload: ListItemMovePayload) => void;
  onItemClick?: (itemId: string) => void;
};

/**
 * Dense vertical grouped list with cross-group drag.
 * Parallel to kanban, but stacked groups (not a board).
 */
export function list(props: ListProps): Element {
  return new Element('list', {
    groups: props.groups ?? [],
    disabled: props.disabled ?? false,
    className: props.className,
    onItemMove: props.onItemMove,
    onItemClick: props.onItemClick,
  });
}
