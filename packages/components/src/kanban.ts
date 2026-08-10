import { Element, withDetached, withParent } from '@clay/core';
import type { ElementNode } from '@clay/core';

/** Per-card detail drawer tree (`{ __ui: ElementNode }`). */
export const KANBAN_DETAIL_FIELD = '__detail';

export type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  /** When the board has `lanes`, groups the card into that swimlane. */
  laneId?: string;
};

export type KanbanLane = {
  id: string;
  title: string;
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
  /** Present when the board uses swimlanes. */
  fromLaneId?: string | null;
  toLaneId?: string | null;
};

type UiDetail = { __ui: ElementNode };

type KanbanCardWire = KanbanCard & { [KANBAN_DETAIL_FIELD]?: UiDetail };

export type KanbanProps = {
  columns?: KanbanColumn[];
  /** Optional horizontal swimlanes; cards use `laneId` to join a lane. */
  lanes?: KanbanLane[];
  /** Open card detail drawer (`null` / omit = closed). Owned by the element. */
  selectedCardId?: string | null;
  disabled?: boolean;
  className?: string;
  /**
   * Fired after the board applies the card move to its owned model.
   * Prefer side effects here; column/card order is already updated.
   */
  onCardMove?: (payload: KanbanCardMovePayload) => void | Promise<void>;
  onCardClick?: (cardId: string) => void | Promise<void>;
  /** After owned `selectedCardId` updates (drawer open/close). */
  onCardSelect?: (cardId: string | null) => void | Promise<void>;
  /** Build detached Element tree stamped as `__detail` for the card drawer. */
  detail?: (card: KanbanCard, column: KanbanColumn) => void;
};

function cloneCard(card: KanbanCard): KanbanCard {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    laneId: card.laneId,
  };
}

function cloneLanes(lanes: KanbanLane[]): KanbanLane[] {
  return lanes.map((lane) => ({ id: lane.id, title: lane.title }));
}

function stripCardWire(card: KanbanCardWire): KanbanCard {
  return cloneCard(card);
}

function cloneColumns(columns: KanbanColumn[]): KanbanColumn[] {
  return columns.map((col) => ({
    id: col.id,
    title: col.title,
    cards: col.cards.map((c) => stripCardWire(c as KanbanCardWire)),
  }));
}

function buildDetailDisplay(
  card: KanbanCard,
  column: KanbanColumn,
  detailFn: (card: KanbanCard, column: KanbanColumn) => void,
): UiDetail {
  const root = new Element('column', { gap: 4 });
  withDetached(() => {
    withParent(root, () => detailFn(card, column));
  });
  const node = root.toJSON();
  root.destroy();
  return { __ui: node };
}

function projectColumns(
  columns: KanbanColumn[],
  detailFn?: (card: KanbanCard, column: KanbanColumn) => void,
): KanbanColumn[] {
  return columns.map((col) => {
    const cleanCol: KanbanColumn = {
      id: col.id,
      title: col.title,
      cards: col.cards.map((c) => stripCardWire(c as KanbanCardWire)),
    };
    if (!detailFn) return cleanCol;
    return {
      ...cleanCol,
      cards: cleanCol.cards.map((card) => {
        const wire: KanbanCardWire = { ...card };
        wire[KANBAN_DETAIL_FIELD] = buildDetailDisplay(card, cleanCol, detailFn);
        return wire;
      }),
    };
  });
}

/** Absolute insert index in a column for a lane-scoped index. */
export function absoluteInsertIndex(
  cards: KanbanCard[],
  targetLaneId: string | null | undefined,
  indexInLane: number,
): number {
  const laneKey = targetLaneId ?? '';
  let seen = 0;
  for (let i = 0; i < cards.length; i++) {
    if ((cards[i]!.laneId ?? '') === laneKey) {
      if (seen === indexInLane) return i;
      seen++;
    }
  }
  for (let i = cards.length - 1; i >= 0; i--) {
    if ((cards[i]!.laneId ?? '') === laneKey) return i + 1;
  }
  return cards.length;
}

/**
 * Interactive kanban board. Owns columns + card order (DataTable/Flow-style);
 * default `cardMove` / `cardSelect` settle handlers update that model before user callbacks.
 * Prefer mutating via element APIs instead of wrapping the board in `ui.auto`.
 */
export class KanbanElement extends Element {
  private detailFn?: (card: KanbanCard, column: KanbanColumn) => void;

  constructor(props: KanbanProps = {}) {
    const {
      onCardMove,
      onCardClick,
      onCardSelect,
      detail,
      columns,
      lanes,
      selectedCardId,
      disabled,
      className,
    } = props;

    const detailFn = detail;
    super('kanban', {
      columns: projectColumns(cloneColumns(columns ?? []), detailFn),
      lanes: cloneLanes(lanes ?? []),
      selectedCardId: selectedCardId ?? null,
      disabled: disabled ?? false,
      className,
    });
    this.detailFn = detailFn;

    // Always register settle events so the client emits them; update owned
    // model first, then chain user callbacks for side effects.
    this.on('cardMove', (value) => {
      const payload = value as KanbanCardMovePayload;
      if (!payload?.cardId || !payload.toColumnId) return;
      this.moveCard(payload);
    });
    this.on('cardSelect', (value) => {
      const cardId = value == null || value === '' ? null : String(value);
      this.selectCard(cardId);
    });
    if (onCardMove) {
      this.on('cardMove', (value) => onCardMove(value as KanbanCardMovePayload));
    }
    if (onCardClick) {
      this.on('cardClick', (value) => onCardClick(value as string));
    }
    if (onCardSelect) {
      this.on('cardSelect', (value) => {
        const cardId = value == null || value === '' ? null : String(value);
        return onCardSelect(cardId);
      });
    }
  }

  private commitColumns(columns: KanbanColumn[]): void {
    this.update({ columns: projectColumns(columns, this.detailFn) });
  }

  getColumns(): KanbanColumn[] {
    return cloneColumns((this.props.columns as KanbanColumn[] | undefined) ?? []);
  }

  setColumns(columns: KanbanColumn[]): this {
    this.commitColumns(cloneColumns(columns));
    return this;
  }

  getLanes(): KanbanLane[] {
    return cloneLanes((this.props.lanes as KanbanLane[] | undefined) ?? []);
  }

  setLanes(lanes: KanbanLane[]): this {
    this.update({ lanes: cloneLanes(lanes) });
    return this;
  }

  getSelectedCardId(): string | null {
    const id = this.props.selectedCardId;
    return id == null || id === '' ? null : String(id);
  }

  selectCard(cardId: string | null): this {
    const next = cardId == null || cardId === '' ? null : String(cardId);
    if (next !== null) {
      const found = this.getColumns().some((col) => col.cards.some((c) => c.id === next));
      if (!found) {
        this.update({ selectedCardId: null });
        return this;
      }
    }
    this.update({ selectedCardId: next });
    return this;
  }

  clearSelection(): this {
    return this.selectCard(null);
  }

  setDisabled(disabled: boolean): this {
    this.update({ disabled });
    return this;
  }

  /** Move a card within/across columns (and optionally lanes) and patch owned `columns`. */
  moveCard(payload: KanbanCardMovePayload): this {
    const { cardId, toColumnId, index, toLaneId } = payload;
    if (!cardId || !toColumnId) return this;

    const next = this.getColumns();
    let moved: KanbanCard | undefined;
    let fromLaneId: string | null | undefined = payload.fromLaneId;
    for (const col of next) {
      const idx = col.cards.findIndex((c) => c.id === cardId);
      if (idx >= 0) {
        [moved] = col.cards.splice(idx, 1);
        if (fromLaneId === undefined) fromLaneId = moved?.laneId ?? null;
        break;
      }
    }
    if (!moved) return this;

    const to = next.find((c) => c.id === toColumnId);
    if (!to) return this;

    const lanes = this.getLanes();
    const useLanes = lanes.length > 0;
    if (useLanes && toLaneId !== undefined) {
      moved.laneId = toLaneId || undefined;
    }

    const insertAt = useLanes
      ? absoluteInsertIndex(to.cards, moved.laneId ?? null, Number(index) || 0)
      : Math.max(0, Math.min(Number(index) || 0, to.cards.length));
    to.cards.splice(insertAt, 0, moved);
    this.commitColumns(next);
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
    this.commitColumns(next);
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
    if (this.getSelectedCardId() === cardId) {
      this.update({ selectedCardId: null, columns: projectColumns(next, this.detailFn) });
      return this;
    }
    this.commitColumns(next);
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
    this.commitColumns(next);
    return this;
  }

  removeColumn(columnId: string): this {
    const cols = this.getColumns();
    const next = cols.filter((c) => c.id !== columnId);
    if (next.length === cols.length) return this;
    const selected = this.getSelectedCardId();
    if (selected && !next.some((c) => c.cards.some((card) => card.id === selected))) {
      this.update({
        selectedCardId: null,
        columns: projectColumns(next, this.detailFn),
      });
      return this;
    }
    this.commitColumns(next);
    return this;
  }

  addLane(lane: KanbanLane, index?: number): this {
    const next = this.getLanes();
    if (next.some((l) => l.id === lane.id)) return this;
    const insertAt =
      index === undefined
        ? next.length
        : Math.max(0, Math.min(index, next.length));
    next.splice(insertAt, 0, { id: lane.id, title: lane.title });
    this.update({ lanes: next });
    return this;
  }

  removeLane(laneId: string): this {
    const lanes = this.getLanes();
    const next = lanes.filter((l) => l.id !== laneId);
    if (next.length === lanes.length) return this;
    // Detach cards from the removed lane (keep them on the board).
    const columns = this.getColumns().map((col) => ({
      ...col,
      cards: col.cards.map((card) =>
        card.laneId === laneId ? { ...card, laneId: undefined } : card,
      ),
    }));
    this.update({
      lanes: next,
      columns: projectColumns(columns, this.detailFn),
    });
    return this;
  }
}

export function kanban(props: KanbanProps = {}): KanbanElement {
  return new KanbanElement(props);
}
