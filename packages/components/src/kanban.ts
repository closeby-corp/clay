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
  columns?: KanbanColumn[];
  disabled?: boolean;
  className?: string;
  /**
   * Fired after the board applies the card move to its owned model.
   * Prefer side effects here; column/card order is already updated.
   */
  onCardMove?: (payload: KanbanCardMovePayload) => void | Promise<void>;
  onCardClick?: (cardId: string) => void | Promise<void>;
};

function cloneCard(card: KanbanCard): KanbanCard {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
  };
}

function cloneColumns(columns: KanbanColumn[]): KanbanColumn[] {
  return columns.map((col) => ({
    id: col.id,
    title: col.title,
    cards: col.cards.map(cloneCard),
  }));
}

/**
 * Interactive kanban board. Owns columns + card order (DataTable/Flow-style);
 * default `cardMove` settle handler updates that model before user callbacks.
 * Prefer mutating via element APIs instead of wrapping the board in `ui.auto`.
 */
export class KanbanElement extends Element {
  constructor(props: KanbanProps = {}) {
    const { onCardMove, onCardClick, columns, disabled, className } = props;

    super('kanban', {
      columns: cloneColumns(columns ?? []),
      disabled: disabled ?? false,
      className,
    });

    // Always register settle events so the client emits them; update owned
    // model first, then chain user callbacks for side effects.
    this.on('cardMove', (value) => {
      const payload = value as KanbanCardMovePayload;
      if (!payload?.cardId || !payload.toColumnId) return;
      this.moveCard(payload);
    });
    if (onCardMove) {
      this.on('cardMove', (value) => onCardMove(value as KanbanCardMovePayload));
    }
    if (onCardClick) {
      this.on('cardClick', (value) => onCardClick(value as string));
    }
  }

  getColumns(): KanbanColumn[] {
    return cloneColumns((this.props.columns as KanbanColumn[] | undefined) ?? []);
  }

  setColumns(columns: KanbanColumn[]): this {
    this.update({ columns: cloneColumns(columns) });
    return this;
  }

  setDisabled(disabled: boolean): this {
    this.update({ disabled });
    return this;
  }

  /** Move a card within/across columns and patch owned `columns`. */
  moveCard(payload: KanbanCardMovePayload): this {
    const { cardId, toColumnId, index } = payload;
    if (!cardId || !toColumnId) return this;

    const next = this.getColumns();
    let moved: KanbanCard | undefined;
    for (const col of next) {
      const idx = col.cards.findIndex((c) => c.id === cardId);
      if (idx >= 0) {
        [moved] = col.cards.splice(idx, 1);
        break;
      }
    }
    if (!moved) return this;

    const to = next.find((c) => c.id === toColumnId);
    if (!to) return this;

    const insertAt = Math.max(0, Math.min(Number(index) || 0, to.cards.length));
    to.cards.splice(insertAt, 0, moved);
    this.update({ columns: next });
    return this;
  }

  addCard(columnId: string, card: KanbanCard, index?: number): this {
    const next = this.getColumns();
    const col = next.find((c) => c.id === columnId);
    if (!col) return this;
    if (next.some((c) => c.cards.some((x) => x.id === card.id))) return this;
    const insertAt =
      index === undefined
        ? col.cards.length
        : Math.max(0, Math.min(index, col.cards.length));
    col.cards.splice(insertAt, 0, cloneCard(card));
    this.update({ columns: next });
    return this;
  }

  removeCard(cardId: string): this {
    const next = this.getColumns();
    let found = false;
    for (const col of next) {
      const idx = col.cards.findIndex((c) => c.id === cardId);
      if (idx >= 0) {
        col.cards.splice(idx, 1);
        found = true;
        break;
      }
    }
    if (!found) return this;
    this.update({ columns: next });
    return this;
  }

  addColumn(column: KanbanColumn, index?: number): this {
    const next = this.getColumns();
    if (next.some((c) => c.id === column.id)) return this;
    const insertAt =
      index === undefined
        ? next.length
        : Math.max(0, Math.min(index, next.length));
    next.splice(insertAt, 0, {
      id: column.id,
      title: column.title,
      cards: column.cards.map(cloneCard),
    });
    this.update({ columns: next });
    return this;
  }

  removeColumn(columnId: string): this {
    const cols = this.getColumns();
    const next = cols.filter((c) => c.id !== columnId);
    if (next.length === cols.length) return this;
    this.update({ columns: next });
    return this;
  }
}

export function kanban(props: KanbanProps = {}): KanbanElement {
  return new KanbanElement(props);
}
