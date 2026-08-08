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

type ListItem = {
  id: string;
  title: string;
  description?: string;
};

type ListGroup = {
  id: string;
  title: string;
  items: ListItem[];
};

type ItemMovePayload = {
  itemId: string;
  fromGroupId: string;
  toGroupId: string;
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

function cloneGroups(groups: ListGroup[]): ListGroup[] {
  return groups.map((g) => ({
    ...g,
    items: g.items.map((item) => ({ ...item })),
  }));
}

function findGroupId(groups: ListGroup[], id: UniqueIdentifier): string | null {
  const sid = String(id);
  for (const g of groups) {
    if (g.id === sid) return g.id;
    if (g.items.some((i) => i.id === sid)) return g.id;
  }
  return null;
}

function findItem(groups: ListGroup[], itemId: string): ListItem | null {
  for (const g of groups) {
    const item = g.items.find((i) => i.id === itemId);
    if (item) return item;
  }
  return null;
}

function itemIndex(groups: ListGroup[], groupId: string, itemId: string): number {
  const g = groups.find((x) => x.id === groupId);
  if (!g) return -1;
  return g.items.findIndex((i) => i.id === itemId);
}

function SortableItem({
  item,
  disabled,
  onClick,
}: {
  item: ListItem;
  disabled: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
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
        'flex items-start gap-2 border-b border-border/60 bg-background px-3 py-2 text-sm last:border-b-0',
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
      <div className="min-w-0 flex-1">
        <div className="font-medium leading-snug">{item.title}</div>
        {item.description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
        ) : null}
      </div>
    </div>
  );
}

function ItemPreview({ item }: { item: ListItem }) {
  return (
    <div className="border bg-background px-3 py-2 text-sm shadow-md">
      <div className="font-medium leading-snug">{item.title}</div>
      {item.description ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
      ) : null}
    </div>
  );
}

function GroupDroppable({
  group,
  disabled,
  onItemClick,
}: {
  group: ListGroup;
  disabled: boolean;
  onItemClick?: (itemId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });
  const ids = group.items.map((i) => i.id);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border bg-muted/30',
        isOver && 'ring-2 ring-ring/40',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-3 py-1.5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {group.title}
        </h3>
        <span className="text-xs text-muted-foreground tabular-nums">{group.items.length}</span>
      </div>
      <div ref={setNodeRef} className="min-h-10">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {group.items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              disabled={disabled}
              onClick={onItemClick ? () => onItemClick(item.id) : undefined}
            />
          ))}
        </SortableContext>
        {group.items.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">Drop items here</div>
        ) : null}
      </div>
    </div>
  );
}

export function BoundList({
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
  const serverGroups = (Array.isArray(props.groups) ? props.groups : []) as ListGroup[];
  const [groups, setGroups] = useOptimisticValue(serverGroups);
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const disabled = !!props.disabled;
  const [activeId, setActiveId] = useState<string | null>(null);
  const originRef = useRef<{ itemId: string; fromGroupId: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeItem = activeId ? findItem(groups, activeId) : null;

  const emitMove = (payload: ItemMovePayload) => {
    if (hasEvent(props, 'itemMove')) emit(id, 'itemMove', payload);
  };

  const onDragStart = (event: DragStartEvent) => {
    if (disabled) return;
    const itemId = String(event.active.id);
    const fromGroupId = findGroupId(groupsRef.current, itemId);
    if (!fromGroupId) return;
    setActiveId(itemId);
    originRef.current = { itemId, fromGroupId };
  };

  const onDragOver = (event: DragOverEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over) return;

    const gs = groupsRef.current;
    const activeGroupId = findGroupId(gs, active.id);
    const overGroupId = findGroupId(gs, over.id);
    if (!activeGroupId || !overGroupId || activeGroupId === overGroupId) return;

    const next = cloneGroups(gs);
    const from = next.find((g) => g.id === activeGroupId);
    const to = next.find((g) => g.id === overGroupId);
    if (!from || !to) return;

    const fromIndex = from.items.findIndex((i) => i.id === String(active.id));
    if (fromIndex < 0) return;
    const [moved] = from.items.splice(fromIndex, 1);

    const overIsGroup = to.id === String(over.id);
    let toIndex = overIsGroup
      ? to.items.length
      : to.items.findIndex((i) => i.id === String(over.id));
    if (toIndex < 0) toIndex = to.items.length;
    to.items.splice(toIndex, 0, moved);
    groupsRef.current = next;
    setGroups(next);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const origin = originRef.current;
    setActiveId(null);
    originRef.current = null;

    if (disabled || !origin) return;

    const { active, over } = event;
    let nextGroups = groupsRef.current;

    if (!over) {
      const toGroupId = findGroupId(nextGroups, origin.itemId) ?? origin.fromGroupId;
      const index = Math.max(0, itemIndex(nextGroups, toGroupId, origin.itemId));
      emitMove({
        itemId: origin.itemId,
        fromGroupId: origin.fromGroupId,
        toGroupId,
        index,
      });
      return;
    }

    const activeGroupId = findGroupId(nextGroups, active.id);
    const overGroupId = findGroupId(nextGroups, over.id);
    if (!activeGroupId || !overGroupId) return;

    if (activeGroupId === overGroupId) {
      const g = nextGroups.find((x) => x.id === activeGroupId);
      if (g) {
        const oldIndex = g.items.findIndex((i) => i.id === String(active.id));
        const overIsGroup = g.id === String(over.id);
        const newIndex = overIsGroup
          ? g.items.length - 1
          : g.items.findIndex((i) => i.id === String(over.id));
        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
          nextGroups = cloneGroups(nextGroups);
          const target = nextGroups.find((x) => x.id === activeGroupId)!;
          target.items = arrayMove(target.items, oldIndex, newIndex);
          groupsRef.current = nextGroups;
          setGroups(nextGroups);
        }
      }
    }

    const toGroupId = findGroupId(nextGroups, origin.itemId) ?? overGroupId;
    const index = Math.max(0, itemIndex(nextGroups, toGroupId, origin.itemId));
    emitMove({
      itemId: origin.itemId,
      fromGroupId: origin.fromGroupId,
      toGroupId,
      index,
    });
  };

  const onDragCancel = () => {
    setActiveId(null);
    originRef.current = null;
    groupsRef.current = serverGroups;
    setGroups(serverGroups);
  };

  return (
    <div className={cn('w-full max-w-xl', className)} style={asStyle(style)}>
      <DndContext
        id={`${id}-list-dnd`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <GroupDroppable
              key={group.id}
              group={group}
              disabled={disabled}
              onItemClick={
                hasEvent(props, 'itemClick')
                  ? (itemId) => emit(id, 'itemClick', itemId)
                  : undefined
              }
            />
          ))}
        </div>
        <DragOverlay>{activeItem ? <ItemPreview item={activeItem} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
