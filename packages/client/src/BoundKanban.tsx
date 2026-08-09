import { useState, useRef, type CSSProperties } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useOptimisticValue } from './useOptimisticValue';
import { cn } from '@/lib/utils';

type Emit = (id: string, type: string, value?: unknown) => void;

type KanbanCard = {
  id: string;
  title: string;
  description?: string;
};

type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

type CardMovePayload = {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  index: number;
};

function asStyle(style: unknown): CSSProperties | undefined {
  if (!style) return undefined;
  if (typeof style === 'string') {
    const out: Record<string, string> = {};
    for (const part of style.split(';')) {
      const [key, ...rest] = part.split(':');
      if (!key || rest.length === 0) continue;
      out[key.trim()] = rest.join(':').trim();
    }
    return out as CSSProperties;
  }
  return style as CSSProperties;
}

function hasEvent(props: Record<string, unknown>, name: string): boolean {
  const events = props.events as string[] | undefined;
  return !!events?.includes(name);
}

function cloneColumns(columns: KanbanColumn[]): KanbanColumn[] {
  return columns.map((col) => ({
    ...col,
    cards: col.cards.map((card) => ({ ...card })),
  }));
}

function findColumnId(columns: KanbanColumn[], id: UniqueIdentifier): string | null {
  const sid = String(id);
  for (const col of columns) {
    if (col.id === sid) return col.id;
    if (col.cards.some((c) => c.id === sid)) return col.id;
  }
  return null;
}

function findCard(columns: KanbanColumn[], cardId: string): KanbanCard | null {
  for (const col of columns) {
    const card = col.cards.find((c) => c.id === cardId);
    if (card) return card;
  }
  return null;
}

function cardIndex(columns: KanbanColumn[], columnId: string, cardId: string): number {
  const col = columns.find((c) => c.id === columnId);
  if (!col) return -1;
  return col.cards.findIndex((c) => c.id === cardId);
}

function SortableCard({
  card,
  disabled,
  onClick,
}: {
  card: KanbanCard;
  disabled: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'rounded-md border bg-card p-3 text-sm shadow-sm',
        isDragging && 'opacity-40',
        !disabled && 'cursor-grab active:cursor-grabbing',
        disabled && 'opacity-60',
      )}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
    >
      <div className="font-medium leading-snug">{card.title}</div>
      {card.description ? (
        <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
      ) : null}
    </div>
  );
}

function CardPreview({ card }: { card: KanbanCard }) {
  return (
    <div className="rounded-md border bg-card p-3 text-sm shadow-md">
      <div className="font-medium leading-snug">{card.title}</div>
      {card.description ? (
        <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
      ) : null}
    </div>
  );
}

function ColumnDroppable({
  column,
  disabled,
  onCardClick,
}: {
  column: KanbanColumn;
  disabled: boolean;
  onCardClick?: (cardId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const ids = column.cards.map((c) => c.id);

  return (
    <div
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-lg border bg-muted/40',
        isOver && 'ring-2 ring-ring/40',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <h3 className="text-sm font-medium">{column.title}</h3>
        <span className="text-xs text-muted-foreground">{column.cards.length}</span>
      </div>
      <div ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2 p-2">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              disabled={disabled}
              onClick={onCardClick ? () => onCardClick(card.id) : undefined}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function BoundKanban({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const serverColumns = (
    Array.isArray(props.columns) ? props.columns : []
  ) as KanbanColumn[];
  const [columns, setColumns] = useOptimisticValue(serverColumns);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const disabled = !!props.disabled;
  const [activeId, setActiveId] = useState<string | null>(null);
  const originRef = useRef<{ cardId: string; fromColumnId: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeCard = activeId ? findCard(columns, activeId) : null;

  const emitMove = (payload: CardMovePayload) => {
    // `cardMove` settle is always registered on KanbanElement (owned columns).
    if (hasEvent(props, 'cardMove')) emit(id, 'cardMove', payload);
  };

  const onDragStart = (event: DragStartEvent) => {
    if (disabled) return;
    const cardId = String(event.active.id);
    const fromColumnId = findColumnId(columnsRef.current, cardId);
    if (!fromColumnId) return;
    setActiveId(cardId);
    originRef.current = { cardId, fromColumnId };
  };

  const onDragOver = (event: DragOverEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over) return;

    const cols = columnsRef.current;
    const activeColId = findColumnId(cols, active.id);
    const overColId = findColumnId(cols, over.id);
    if (!activeColId || !overColId || activeColId === overColId) return;

    const next = cloneColumns(cols);
    const from = next.find((c) => c.id === activeColId);
    const to = next.find((c) => c.id === overColId);
    if (!from || !to) return;

    const fromIndex = from.cards.findIndex((c) => c.id === String(active.id));
    if (fromIndex < 0) return;
    const [moved] = from.cards.splice(fromIndex, 1);

    const overIsColumn = to.id === String(over.id);
    let toIndex = overIsColumn
      ? to.cards.length
      : to.cards.findIndex((c) => c.id === String(over.id));
    if (toIndex < 0) toIndex = to.cards.length;
    to.cards.splice(toIndex, 0, moved);
    columnsRef.current = next;
    setColumns(next);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const origin = originRef.current;
    setActiveId(null);
    originRef.current = null;

    if (disabled || !origin) return;

    const { active, over } = event;
    let nextColumns = columnsRef.current;

    if (!over) {
      const toColumnId = findColumnId(nextColumns, origin.cardId) ?? origin.fromColumnId;
      const index = Math.max(0, cardIndex(nextColumns, toColumnId, origin.cardId));
      emitMove({
        cardId: origin.cardId,
        fromColumnId: origin.fromColumnId,
        toColumnId,
        index,
      });
      return;
    }

    const activeColId = findColumnId(nextColumns, active.id);
    const overColId = findColumnId(nextColumns, over.id);
    if (!activeColId || !overColId) return;

    if (activeColId === overColId) {
      const col = nextColumns.find((c) => c.id === activeColId);
      if (col) {
        const oldIndex = col.cards.findIndex((c) => c.id === String(active.id));
        const overIsColumn = col.id === String(over.id);
        const newIndex = overIsColumn
          ? col.cards.length - 1
          : col.cards.findIndex((c) => c.id === String(over.id));
        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
          nextColumns = cloneColumns(nextColumns);
          const target = nextColumns.find((c) => c.id === activeColId)!;
          target.cards = arrayMove(target.cards, oldIndex, newIndex);
          columnsRef.current = nextColumns;
          setColumns(nextColumns);
        }
      }
    }

    const toColumnId = findColumnId(nextColumns, origin.cardId) ?? overColId;
    const index = Math.max(0, cardIndex(nextColumns, toColumnId, origin.cardId));
    emitMove({
      cardId: origin.cardId,
      fromColumnId: origin.fromColumnId,
      toColumnId,
      index,
    });
  };

  const onDragCancel = () => {
    setActiveId(null);
    originRef.current = null;
    columnsRef.current = serverColumns;
    setColumns(serverColumns);
  };

  return (
    <div className={cn('w-full', className)} style={asStyle(style)}>
      <DndContext
        id={`${id}-kanban-dnd`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex gap-3 overflow-x-auto pb-2">
          {columns.map((column) => (
            <ColumnDroppable
              key={column.id}
              column={column}
              disabled={disabled}
              onCardClick={
                hasEvent(props, 'cardClick')
                  ? (cardId) => emit(id, 'cardClick', cardId)
                  : undefined
              }
            />
          ))}
        </div>
        <DragOverlay>{activeCard ? <CardPreview card={activeCard} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
