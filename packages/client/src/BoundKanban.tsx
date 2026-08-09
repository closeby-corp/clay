import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
import type { ElementNode } from './protocol';
import { useOptimisticValue } from './useOptimisticValue';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

type Emit = (id: string, type: string, value?: unknown) => void;
type RenderNode = (node: ElementNode, emit: Emit) => ReactNode;

const DETAIL_FIELD = '__detail';
const CELL_PREFIX = '__cell:';

type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  laneId?: string;
  [DETAIL_FIELD]?: { __ui: ElementNode };
};

type KanbanLane = {
  id: string;
  title: string;
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
  fromLaneId?: string | null;
  toLaneId?: string | null;
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

function cellDropId(columnId: string, laneId: string): string {
  return `${CELL_PREFIX}${columnId}:${laneId}`;
}

function parseCellDropId(id: UniqueIdentifier): { columnId: string; laneId: string } | null {
  const sid = String(id);
  if (!sid.startsWith(CELL_PREFIX)) return null;
  const rest = sid.slice(CELL_PREFIX.length);
  const idx = rest.indexOf(':');
  if (idx < 0) return null;
  return { columnId: rest.slice(0, idx), laneId: rest.slice(idx + 1) };
}

function findColumnId(columns: KanbanColumn[], id: UniqueIdentifier): string | null {
  const sid = String(id);
  const cell = parseCellDropId(id);
  if (cell) return cell.columnId;
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

function findCardColumn(columns: KanbanColumn[], cardId: string): KanbanColumn | null {
  for (const col of columns) {
    if (col.cards.some((c) => c.id === cardId)) return col;
  }
  return null;
}

function cardIndex(columns: KanbanColumn[], columnId: string, cardId: string): number {
  const col = columns.find((c) => c.id === columnId);
  if (!col) return -1;
  return col.cards.findIndex((c) => c.id === cardId);
}

function laneKey(laneId: string | null | undefined): string {
  return laneId ?? '';
}

function cardsInLane(cards: KanbanCard[], laneId: string): KanbanCard[] {
  const key = laneKey(laneId);
  return cards.filter((c) => laneKey(c.laneId) === key);
}

function laneScopedIndex(cards: KanbanCard[], cardId: string, laneId: string | null | undefined): number {
  const inLane = cardsInLane(cards, laneKey(laneId));
  return inLane.findIndex((c) => c.id === cardId);
}

function absoluteInsertIndex(
  cards: KanbanCard[],
  targetLaneId: string | null | undefined,
  indexInLane: number,
): number {
  const key = laneKey(targetLaneId);
  let seen = 0;
  for (let i = 0; i < cards.length; i++) {
    if (laneKey(cards[i]!.laneId) === key) {
      if (seen === indexInLane) return i;
      seen++;
    }
  }
  for (let i = cards.length - 1; i >= 0; i--) {
    if (laneKey(cards[i]!.laneId) === key) return i + 1;
  }
  return cards.length;
}

function isUiDetail(value: unknown): value is { __ui: ElementNode } {
  return !!value && typeof value === 'object' && '__ui' in (value as object);
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
        if (disabled || isDragging) return;
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

function CardList({
  cards,
  droppableId,
  disabled,
  onCardClick,
  minHeightClass = 'min-h-24',
}: {
  cards: KanbanCard[];
  droppableId: string;
  disabled: boolean;
  onCardClick?: (cardId: string) => void;
  minHeightClass?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const ids = cards.map((c) => c.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-1 flex-col gap-2 p-2',
        minHeightClass,
        isOver && 'rounded-md bg-accent/40',
      )}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {cards.map((card) => (
          <SortableCard
            key={card.id}
            card={card}
            disabled={disabled}
            onClick={onCardClick ? () => onCardClick(card.id) : undefined}
          />
        ))}
      </SortableContext>
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
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/40">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <h3 className="text-sm font-medium">{column.title}</h3>
        <span className="text-xs text-muted-foreground">{column.cards.length}</span>
      </div>
      <CardList
        cards={column.cards}
        droppableId={column.id}
        disabled={disabled}
        onCardClick={onCardClick}
      />
    </div>
  );
}

function SwimlaneBoard({
  columns,
  lanes,
  disabled,
  onCardClick,
}: {
  columns: KanbanColumn[];
  lanes: KanbanLane[];
  disabled: boolean;
  onCardClick?: (cardId: string) => void;
}) {
  const effectiveLanes =
    lanes.length > 0
      ? lanes
      : [{ id: '', title: 'Unassigned' }];

  // Include an Unassigned band when some cards lack a known laneId.
  const laneIds = new Set(lanes.map((l) => l.id));
  const hasOrphans = columns.some((col) =>
    col.cards.some((c) => !c.laneId || !laneIds.has(c.laneId)),
  );
  const bands: KanbanLane[] =
    hasOrphans && !laneIds.has('')
      ? [{ id: '', title: 'Unassigned' }, ...effectiveLanes]
      : effectiveLanes;

  return (
    <div className="flex min-w-max flex-col gap-3">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `8rem repeat(${columns.length}, 18rem)` }}
      >
        <div />
        {columns.map((column) => (
          <div
            key={`head-${column.id}`}
            className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2"
          >
            <h3 className="text-sm font-medium">{column.title}</h3>
            <span className="text-xs text-muted-foreground">{column.cards.length}</span>
          </div>
        ))}
      </div>
      {bands.map((lane) => (
        <div
          key={lane.id || '__unassigned'}
          className="grid gap-3"
          style={{ gridTemplateColumns: `8rem repeat(${columns.length}, 18rem)` }}
        >
          <div className="flex items-start pt-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {lane.title}
            </span>
          </div>
          {columns.map((column) => {
            const cellCards = cardsInLane(column.cards, lane.id);
            return (
              <div
                key={`${column.id}:${lane.id}`}
                className="flex flex-col rounded-lg border bg-muted/40"
              >
                <CardList
                  cards={cellCards}
                  droppableId={cellDropId(column.id, lane.id)}
                  disabled={disabled}
                  onCardClick={onCardClick}
                  minHeightClass="min-h-20"
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function CardDetailDrawer({
  open,
  card,
  column,
  lane,
  onOpenChange,
  emit,
  renderNode,
}: {
  open: boolean;
  card: KanbanCard | null;
  column: KanbanColumn | null;
  lane: KanbanLane | null;
  onOpenChange: (open: boolean) => void;
  emit: Emit;
  renderNode?: RenderNode;
}) {
  const isMobile = useIsMobile();
  const detail = card?.[DETAIL_FIELD];

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={isMobile ? 'bottom' : 'right'}
    >
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{card?.title ?? 'Card'}</DrawerTitle>
          <DrawerDescription>
            {[column?.title, lane?.title].filter(Boolean).join(' · ') || 'Card details'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4 text-sm">
          {isUiDetail(detail) && renderNode ? (
            renderNode(detail.__ui, emit)
          ) : (
            <>
              {card?.description ? (
                <p className="text-muted-foreground">{card.description}</p>
              ) : (
                <p className="text-muted-foreground">No description.</p>
              )}
              {column ? (
                <div className="text-xs text-muted-foreground">
                  Column: <span className="text-foreground">{column.title}</span>
                </div>
              ) : null}
              {lane ? (
                <div className="text-xs text-muted-foreground">
                  Lane: <span className="text-foreground">{lane.title}</span>
                </div>
              ) : null}
            </>
          )}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function BoundKanban({
  id,
  props,
  className,
  style,
  emit,
  renderNode,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
  renderNode?: RenderNode;
}) {
  const serverColumns = (
    Array.isArray(props.columns) ? props.columns : []
  ) as KanbanColumn[];
  const serverLanes = (Array.isArray(props.lanes) ? props.lanes : []) as KanbanLane[];
  const serverSelected =
    props.selectedCardId == null || props.selectedCardId === ''
      ? null
      : String(props.selectedCardId);

  const [columns, setColumns] = useOptimisticValue(serverColumns);
  const [selectedCardId, setSelectedCardId] = useOptimisticValue(serverSelected);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const disabled = !!props.disabled;
  const [activeId, setActiveId] = useState<string | null>(null);
  const originRef = useRef<{
    cardId: string;
    fromColumnId: string;
    fromLaneId: string | null;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const useLanes = serverLanes.length > 0;
  const activeCard = activeId ? findCard(columns, activeId) : null;
  const selectedCard = selectedCardId ? findCard(columns, selectedCardId) : null;
  const selectedColumn = selectedCardId ? findCardColumn(columns, selectedCardId) : null;
  const selectedLane =
    selectedCard?.laneId != null
      ? serverLanes.find((l) => l.id === selectedCard.laneId) ?? null
      : null;

  const emitMove = (payload: CardMovePayload) => {
    // `cardMove` settle is always registered on KanbanElement (owned columns).
    if (hasEvent(props, 'cardMove')) emit(id, 'cardMove', payload);
  };

  const emitSelect = (cardId: string | null) => {
    if (hasEvent(props, 'cardSelect')) emit(id, 'cardSelect', cardId);
  };

  const openCard = (cardId: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setSelectedCardId(cardId);
    emitSelect(cardId);
    if (hasEvent(props, 'cardClick')) emit(id, 'cardClick', cardId);
  };

  const onDrawerOpenChange = (open: boolean) => {
    if (open) return;
    setSelectedCardId(null);
    emitSelect(null);
  };

  const onDragStart = (event: DragStartEvent) => {
    if (disabled) return;
    const cardId = String(event.active.id);
    const fromColumnId = findColumnId(columnsRef.current, cardId);
    if (!fromColumnId) return;
    const card = findCard(columnsRef.current, cardId);
    suppressClickRef.current = true;
    setActiveId(cardId);
    originRef.current = {
      cardId,
      fromColumnId,
      fromLaneId: card?.laneId ?? null,
    };
  };

  const onDragOver = (event: DragOverEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over) return;

    const cols = columnsRef.current;
    const activeColId = findColumnId(cols, active.id);
    const overColId = findColumnId(cols, over.id);
    if (!activeColId || !overColId) return;

    const overCell = parseCellDropId(over.id);
    const overCard = findCard(cols, String(over.id));
    const activeCardLocal = findCard(cols, String(active.id));
    if (!activeCardLocal) return;

    const targetLaneId = useLanes
      ? (overCell?.laneId ?? overCard?.laneId ?? activeCardLocal.laneId ?? '')
      : activeCardLocal.laneId;

    const sameColumn = activeColId === overColId;
    const sameLane = !useLanes || laneKey(activeCardLocal.laneId) === laneKey(targetLaneId);
    if (sameColumn && sameLane) return;

    const next = cloneColumns(cols);
    const from = next.find((c) => c.id === activeColId);
    const to = next.find((c) => c.id === overColId);
    if (!from || !to) return;

    const fromIndex = from.cards.findIndex((c) => c.id === String(active.id));
    if (fromIndex < 0) return;
    const [moved] = from.cards.splice(fromIndex, 1);
    if (!moved) return;

    if (useLanes) {
      moved.laneId = targetLaneId || undefined;
    }

    const overIsColumn = to.id === String(over.id) || !!overCell;
    let toIndex: number;
    if (useLanes) {
      if (overIsColumn || overCell) {
        toIndex = absoluteInsertIndex(to.cards, moved.laneId, cardsInLane(to.cards, moved.laneId ?? '').length);
      } else {
        const overIdx = laneScopedIndex(to.cards, String(over.id), moved.laneId);
        toIndex = absoluteInsertIndex(to.cards, moved.laneId, overIdx < 0 ? cardsInLane(to.cards, moved.laneId ?? '').length : overIdx);
      }
    } else {
      toIndex = overIsColumn
        ? to.cards.length
        : to.cards.findIndex((c) => c.id === String(over.id));
      if (toIndex < 0) toIndex = to.cards.length;
    }

    to.cards.splice(toIndex, 0, moved);
    columnsRef.current = next;
    setColumns(next);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const origin = originRef.current;
    setActiveId(null);
    originRef.current = null;
    // Swallow the click that follows a drag.
    queueMicrotask(() => {
      suppressClickRef.current = false;
    });

    if (disabled || !origin) return;

    const { active, over } = event;
    let nextColumns = columnsRef.current;

    if (!over) {
      const toColumnId = findColumnId(nextColumns, origin.cardId) ?? origin.fromColumnId;
      const card = findCard(nextColumns, origin.cardId);
      const toLaneId = card?.laneId ?? null;
      const col = nextColumns.find((c) => c.id === toColumnId);
      const index = useLanes
        ? Math.max(0, laneScopedIndex(col?.cards ?? [], origin.cardId, toLaneId))
        : Math.max(0, cardIndex(nextColumns, toColumnId, origin.cardId));
      emitMove({
        cardId: origin.cardId,
        fromColumnId: origin.fromColumnId,
        toColumnId,
        index,
        ...(useLanes
          ? { fromLaneId: origin.fromLaneId, toLaneId }
          : {}),
      });
      return;
    }

    const activeColId = findColumnId(nextColumns, active.id);
    const overColId = findColumnId(nextColumns, over.id);
    if (!activeColId || !overColId) return;

    const overCell = parseCellDropId(over.id);

    if (activeColId === overColId && !overCell) {
      const col = nextColumns.find((c) => c.id === activeColId);
      if (col) {
        if (useLanes) {
          const activeCardLocal = findCard(nextColumns, String(active.id));
          const overCard = findCard(nextColumns, String(over.id));
          if (
            activeCardLocal &&
            overCard &&
            laneKey(activeCardLocal.laneId) === laneKey(overCard.laneId)
          ) {
            const laneCards = cardsInLane(col.cards, activeCardLocal.laneId);
            const oldLaneIndex = laneCards.findIndex((c) => c.id === String(active.id));
            const newLaneIndex = laneCards.findIndex((c) => c.id === String(over.id));
            if (oldLaneIndex >= 0 && newLaneIndex >= 0 && oldLaneIndex !== newLaneIndex) {
              const reordered = arrayMove(laneCards, oldLaneIndex, newLaneIndex);
              nextColumns = cloneColumns(nextColumns);
              const target = nextColumns.find((c) => c.id === activeColId)!;
              const lane = laneKey(activeCardLocal.laneId);
              let ri = 0;
              target.cards = target.cards.map((c) => {
                if (laneKey(c.laneId) !== lane) return c;
                return reordered[ri++]!;
              });
              columnsRef.current = nextColumns;
              setColumns(nextColumns);
            }
          }
        } else {
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
    } else if (useLanes && activeColId === overColId && overCell) {
      // Dropped on empty cell area in same column — lane may already be updated in onDragOver.
    }

    const card = findCard(nextColumns, origin.cardId);
    const toColumnId = findColumnId(nextColumns, origin.cardId) ?? overColId;
    const toLaneId = card?.laneId ?? null;
    const col = nextColumns.find((c) => c.id === toColumnId);
    const index = useLanes
      ? Math.max(0, laneScopedIndex(col?.cards ?? [], origin.cardId, toLaneId))
      : Math.max(0, cardIndex(nextColumns, toColumnId, origin.cardId));

    emitMove({
      cardId: origin.cardId,
      fromColumnId: origin.fromColumnId,
      toColumnId,
      index,
      ...(useLanes
        ? { fromLaneId: origin.fromLaneId, toLaneId }
        : {}),
    });
  };

  const onDragCancel = () => {
    setActiveId(null);
    originRef.current = null;
    suppressClickRef.current = false;
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
        <div className="overflow-x-auto pb-2">
          {useLanes ? (
            <SwimlaneBoard
              columns={columns}
              lanes={serverLanes}
              disabled={disabled}
              onCardClick={openCard}
            />
          ) : (
            <div className="flex gap-3">
              {columns.map((column) => (
                <ColumnDroppable
                  key={column.id}
                  column={column}
                  disabled={disabled}
                  onCardClick={openCard}
                />
              ))}
            </div>
          )}
        </div>
        <DragOverlay>{activeCard ? <CardPreview card={activeCard} /> : null}</DragOverlay>
      </DndContext>

      <CardDetailDrawer
        open={!!selectedCard}
        card={selectedCard}
        column={selectedColumn}
        lane={selectedLane}
        onOpenChange={onDrawerOpenChange}
        emit={emit}
        renderNode={renderNode}
      />
    </div>
  );
}
