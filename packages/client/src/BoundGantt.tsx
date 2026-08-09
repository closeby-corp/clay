import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import {
  addDays,
  differenceInCalendarDays,
  eachMonthOfInterval,
  format,
  isValid,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfDay,
} from 'date-fns';
import { useOptimisticValue } from './useOptimisticValue';
import { cn } from '@/lib/utils';

type Emit = (id: string, type: string, value?: unknown) => void;

type GanttItem = {
  id: string;
  title: string;
  start: string;
  end: string;
};

type GanttRow = {
  id: string;
  title: string;
  items: GanttItem[];
};

type GanttMarker = {
  id: string;
  date: string;
  label?: string;
};

type GanttDependency = {
  id: string;
  from: string;
  to: string;
};

type GanttRange = {
  start: string;
  end: string;
};

type ItemMovePayload = {
  itemId: string;
  rowId: string;
  start: string;
  end: string;
};

type DragMode = 'move' | 'resize-start' | 'resize-end';

type DragState = {
  mode: DragMode;
  itemId: string;
  rowId: string;
  originX: number;
  startMs: number;
  endMs: number;
  pointerId: number;
  moved: boolean;
};

const SIDEBAR_WIDTH = 176;
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 44;
const BAR_HEIGHT = 28;
const BAR_COLORS = [
  'bg-sky-700 text-sky-50',
  'bg-emerald-700 text-emerald-50',
  'bg-amber-700 text-amber-50',
  'bg-rose-700 text-rose-50',
  'bg-teal-700 text-teal-50',
  'bg-slate-700 text-slate-50',
];

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

function parseDay(value: string): Date | null {
  const d = parseISO(value);
  if (!isValid(d)) return null;
  return startOfDay(d);
}

function toIsoDay(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function collectDates(rows: GanttRow[], markers: GanttMarker[]): Date[] {
  const out: Date[] = [];
  for (const row of rows) {
    for (const item of row.items) {
      const s = parseDay(item.start);
      const e = parseDay(item.end);
      if (s) out.push(s);
      if (e) out.push(e);
    }
  }
  for (const m of markers) {
    const d = parseDay(m.date);
    if (d) out.push(d);
  }
  return out;
}

function resolveRange(
  rows: GanttRow[],
  markers: GanttMarker[],
  range?: GanttRange,
): { start: Date; end: Date } {
  if (range?.start && range?.end) {
    const s = parseDay(range.start);
    const e = parseDay(range.end);
    if (s && e && e >= s) return { start: s, end: e };
  }

  const dates = collectDates(rows, markers);
  const today = startOfDay(new Date());
  if (dates.length === 0) {
    return { start: addDays(today, -14), end: addDays(today, 45) };
  }
  const start = addDays(minDate(dates), -3);
  const end = addDays(maxDate([...dates, today]), 7);
  return { start, end: end < start ? addDays(start, 30) : end };
}

function pxPerDayForSpan(spanDays: number): number {
  if (spanDays <= 14) return 28;
  if (spanDays <= 45) return 14;
  if (spanDays <= 120) return 8;
  if (spanDays <= 240) return 5;
  return 3;
}

function findItem(
  rows: GanttRow[],
  itemId: string,
): { row: GanttRow; item: GanttItem; rowIndex: number } | null {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]!;
    const item = row.items.find((i) => i.id === itemId);
    if (item) return { row, item, rowIndex };
  }
  return null;
}

/** Patch dates in place; optionally move the item to another row. */
function relocateItem(
  rows: GanttRow[],
  itemId: string,
  targetRowId: string,
  start: string,
  end: string,
): GanttRow[] {
  const next = rows.map((row) => ({
    ...row,
    items: row.items.map((item) => ({ ...item })),
  }));

  let found: { item: GanttItem; fromId: string; index: number } | null = null;
  for (const row of next) {
    const index = row.items.findIndex((i) => i.id === itemId);
    if (index >= 0) {
      found = { item: row.items[index]!, fromId: row.id, index };
      break;
    }
  }
  if (!found) return rows;

  const updated: GanttItem = { ...found.item, start, end };

  if (targetRowId === found.fromId) {
    const row = next.find((r) => r.id === found!.fromId)!;
    row.items[found.index] = updated;
    return next;
  }

  const target = next.find((r) => r.id === targetRowId);
  if (!target) {
    const row = next.find((r) => r.id === found!.fromId)!;
    row.items[found.index] = updated;
    return next;
  }

  const from = next.find((r) => r.id === found.fromId)!;
  from.items.splice(found.index, 1);
  target.items.push(updated);
  return next;
}

type BarGeom = {
  itemId: string;
  rowIndex: number;
  left: number;
  right: number;
  cy: number;
};

function barGeometries(
  rows: GanttRow[],
  dayToX: (d: Date) => number,
  pxPerDay: number,
): Map<string, BarGeom> {
  const map = new Map<string, BarGeom>();
  rows.forEach((row, rowIndex) => {
    for (const item of row.items) {
      const s = parseDay(item.start);
      const e = parseDay(item.end);
      if (!s || !e) continue;
      const left = dayToX(s);
      const width = Math.max(
        pxPerDay,
        (differenceInCalendarDays(e, s) + 1) * pxPerDay,
      );
      map.set(item.id, {
        itemId: item.id,
        rowIndex,
        left,
        right: left + width,
        cy: rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2,
      });
    }
  });
  return map;
}

function dependencyPath(from: BarGeom, to: BarGeom): string {
  const x1 = from.right;
  const y1 = from.cy;
  const x2 = to.left;
  const y2 = to.cy;
  const dx = Math.max(16, Math.min(40, Math.abs(x2 - x1) / 2));
  // Elbow when successor starts before predecessor ends (overlap / back-edge).
  if (x2 <= x1 + 8) {
    const midY = (y1 + y2) / 2;
    const outX = x1 + 12;
    const inX = x2 - 12;
    return `M ${x1} ${y1} L ${outX} ${y1} L ${outX} ${midY} L ${inX} ${midY} L ${inX} ${y2} L ${x2} ${y2}`;
  }
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export function BoundGantt({
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
  const serverRows = (Array.isArray(props.rows) ? props.rows : []) as GanttRow[];
  const [rows, setRows] = useOptimisticValue(serverRows);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const serverMarkers = (Array.isArray(props.markers) ? props.markers : []) as GanttMarker[];
  const [markers, setMarkers] = useOptimisticValue(serverMarkers);
  const markersRef = useRef(markers);
  markersRef.current = markers;

  const dependencies = (
    Array.isArray(props.dependencies) ? props.dependencies : []
  ) as GanttDependency[];

  const rangeProp = props.range as GanttRange | undefined;
  const readonly = !!props.readonly;

  const { start: rangeStart, end: rangeEnd } = resolveRange(rows, markers, rangeProp);
  const spanDays = Math.max(1, differenceInCalendarDays(rangeEnd, rangeStart));
  const pxPerDay = pxPerDayForSpan(spanDays);
  const timelineWidth = Math.max(320, spanDays * pxPerDay);

  const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd });
  const today = startOfDay(new Date());
  const todayOffset = differenceInCalendarDays(today, rangeStart);
  const showToday = todayOffset >= 0 && todayOffset <= spanDays;

  const dragRef = useRef<DragState | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverRowId, setHoverRowId] = useState<string | null>(null);
  const suppressClickRef = useRef(false);
  const rowsAreaRef = useRef<HTMLDivElement>(null);

  const dayToX = (d: Date) => differenceInCalendarDays(d, rangeStart) * pxPerDay;
  const pxPerDayRef = useRef(pxPerDay);
  pxPerDayRef.current = pxPerDay;
  const rangeStartRef = useRef(rangeStart);
  rangeStartRef.current = rangeStart;
  const emitRef = useRef(emit);
  emitRef.current = emit;
  const propsRef = useRef(props);
  propsRef.current = props;
  const idRef = useRef(id);
  idRef.current = id;
  const readonlyRef = useRef(readonly);
  readonlyRef.current = readonly;

  const rowIdAtClientY = (clientY: number, currentRows: GanttRow[]): string | null => {
    const area = rowsAreaRef.current;
    if (!area || currentRows.length === 0) return null;
    const rect = area.getBoundingClientRect();
    const y = clientY - rect.top;
    if (y < 0) return currentRows[0]!.id;
    if (y >= rect.height) return currentRows[currentRows.length - 1]!.id;
    const index = Math.min(
      currentRows.length - 1,
      Math.max(0, Math.floor(y / ROW_HEIGHT)),
    );
    return currentRows[index]?.id ?? null;
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      const deltaDays = Math.round((e.clientX - drag.originX) / pxPerDayRef.current);
      if (deltaDays !== 0) drag.moved = true;

      let nextStart = new Date(drag.startMs);
      let nextEnd = new Date(drag.endMs);
      const span = differenceInCalendarDays(nextEnd, nextStart);

      if (drag.mode === 'move') {
        nextStart = addDays(new Date(drag.startMs), deltaDays);
        nextEnd = addDays(nextStart, span);
        const nextRowId = rowIdAtClientY(e.clientY, rowsRef.current);
        if (nextRowId && nextRowId !== drag.rowId) {
          drag.rowId = nextRowId;
          drag.moved = true;
          setHoverRowId(nextRowId);
        }
      } else if (drag.mode === 'resize-start') {
        nextStart = addDays(new Date(drag.startMs), deltaDays);
        if (differenceInCalendarDays(nextEnd, nextStart) < 0) {
          nextStart = nextEnd;
        }
      } else {
        nextEnd = addDays(new Date(drag.endMs), deltaDays);
        if (differenceInCalendarDays(nextEnd, nextStart) < 0) {
          nextEnd = nextStart;
        }
      }

      const next = relocateItem(
        rowsRef.current,
        drag.itemId,
        drag.rowId,
        toIsoDay(nextStart),
        toIsoDay(nextEnd),
      );
      rowsRef.current = next;
      setRows(next);
    };

    const onUp = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      setDraggingId(null);
      setHoverRowId(null);
      if (!drag.moved) return;
      suppressClickRef.current = true;
      const found = findItem(rowsRef.current, drag.itemId);
      if (!found) return;
      // `itemMove` settle is always registered on GanttElement (owned rows/dates).
      if (hasEvent(propsRef.current, 'itemMove')) {
        emitRef.current(idRef.current, 'itemMove', {
          itemId: drag.itemId,
          rowId: drag.rowId,
          start: found.item.start,
          end: found.item.end,
        } satisfies ItemMovePayload);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [setRows]);

  const startDrag = (
    e: ReactPointerEvent,
    mode: DragMode,
    item: GanttItem,
    rowId: string,
  ) => {
    if (readonly) return;
    e.preventDefault();
    e.stopPropagation();
    const s = parseDay(item.start);
    const end = parseDay(item.end);
    if (!s || !end) return;
    dragRef.current = {
      mode,
      itemId: item.id,
      rowId,
      originX: e.clientX,
      startMs: s.getTime(),
      endMs: end.getTime(),
      pointerId: e.pointerId,
      moved: false,
    };
    setDraggingId(item.id);
    if (mode === 'move') setHoverRowId(rowId);
  };

  const emitClick = (itemId: string) => {
    if (hasEvent(props, 'itemClick')) emit(id, 'itemClick', itemId);
  };

  const addMarkerAtClientX = (clientX: number, timelineEl: HTMLElement) => {
    if (readonlyRef.current) return;
    if (!hasEvent(propsRef.current, 'markerAdd')) return;
    const rect = timelineEl.getBoundingClientRect();
    // Header moves with horizontal scroll; rect.left already accounts for it.
    const x = clientX - rect.left;
    const dayOffset = Math.round(x / pxPerDayRef.current);
    const date = addDays(rangeStartRef.current, dayOffset);
    const marker: GanttMarker = {
      id: `m-${Date.now()}`,
      date: toIsoDay(date),
      label: 'Marker',
    };
    const next = [...markersRef.current, marker];
    markersRef.current = next;
    setMarkers(next);
    emitRef.current(idRef.current, 'markerAdd', marker);
  };

  const geoms = barGeometries(rows, dayToX, pxPerDay);
  const bodyHeight = Math.max(ROW_HEIGHT, rows.length * ROW_HEIGHT);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-background text-sm',
        className,
      )}
      style={asStyle(style)}
      data-readonly={readonly || undefined}
    >
      <div className="flex max-h-[560px] overflow-auto">
        {/* Sidebar */}
        <div
          className="sticky left-0 z-20 shrink-0 border-r bg-background"
          style={{ width: SIDEBAR_WIDTH }}
        >
          <div
            className="sticky top-0 z-10 border-b bg-muted/40 px-3 text-xs font-medium text-muted-foreground"
            style={{ height: HEADER_HEIGHT, lineHeight: `${HEADER_HEIGHT}px` }}
          >
            Rows
          </div>
          {rows.map((row) => (
            <div
              key={row.id}
              className={cn(
                'flex items-center border-b px-3 font-medium',
                hoverRowId === row.id && 'bg-accent/50',
              )}
              style={{ height: ROW_HEIGHT }}
              title={row.title}
            >
              <span className="truncate">{row.title}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative min-w-0 flex-1">
          <div style={{ width: timelineWidth, minWidth: '100%' }}>
            {/* Header — double-click to add a marker when not readonly */}
            <div
              className="sticky top-0 z-10 border-b bg-muted/40"
              style={{ height: HEADER_HEIGHT }}
              title={
                readonly
                  ? undefined
                  : 'Double-click to add a marker at this date'
              }
              onDoubleClick={(ev) => {
                addMarkerAtClientX(ev.clientX, ev.currentTarget);
              }}
            >
              <div className="relative h-full" style={{ width: timelineWidth }}>
                {months.map((month, i) => {
                  const left = dayToX(month);
                  const next = months[i + 1];
                  const right = next ? dayToX(next) : timelineWidth;
                  const width = Math.max(40, right - left);
                  return (
                    <div
                      key={month.toISOString()}
                      className="absolute top-0 flex h-full flex-col justify-center border-l border-border/60 px-2"
                      style={{ left, width }}
                    >
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {format(month, 'yyyy')}
                      </span>
                      <span className="text-xs font-medium">{format(month, 'MMM')}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rows + bars */}
            <div
              ref={rowsAreaRef}
              className="relative"
              style={{ width: timelineWidth, height: bodyHeight }}
            >
              {/* Grid lines */}
              {months.map((month) => (
                <div
                  key={`grid-${month.toISOString()}`}
                  className="pointer-events-none absolute top-0 bottom-0 border-l border-border/40"
                  style={{ left: dayToX(month) }}
                />
              ))}

              {/* Today */}
              {showToday ? (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 z-[5] w-px bg-rose-500"
                  style={{ left: dayToX(today) }}
                  title={`Today ${toIsoDay(today)}`}
                >
                  <span className="absolute top-1 left-1 whitespace-nowrap rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Today
                  </span>
                </div>
              ) : null}

              {/* Custom markers */}
              {markers.map((marker) => {
                const d = parseDay(marker.date);
                if (!d) return null;
                const left = dayToX(d);
                if (left < 0 || left > timelineWidth) return null;
                return (
                  <div
                    key={marker.id}
                    className="pointer-events-none absolute top-0 bottom-0 z-[4] w-px bg-sky-500/80"
                    style={{ left }}
                    title={marker.label ?? marker.date}
                  >
                    {marker.label ? (
                      <span className="absolute top-1 left-1 max-w-[120px] truncate rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {marker.label}
                      </span>
                    ) : null}
                  </div>
                );
              })}

              {/* Dependency arrows */}
              {dependencies.length > 0 ? (
                <svg
                  className="pointer-events-none absolute inset-0 z-[6] overflow-visible"
                  width={timelineWidth}
                  height={bodyHeight}
                  aria-hidden
                >
                  <defs>
                    <marker
                      id={`${id}-gantt-arrow`}
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L8,4 L0,8 Z" className="fill-muted-foreground" />
                    </marker>
                  </defs>
                  {dependencies.map((dep) => {
                    const from = geoms.get(dep.from);
                    const to = geoms.get(dep.to);
                    if (!from || !to) return null;
                    return (
                      <path
                        key={dep.id}
                        d={dependencyPath(from, to)}
                        fill="none"
                        className="stroke-muted-foreground"
                        strokeWidth={1.5}
                        markerEnd={`url(#${id}-gantt-arrow)`}
                      />
                    );
                  })}
                </svg>
              ) : null}

              {rows.map((row, rowIndex) => (
                <div
                  key={row.id}
                  className={cn(
                    'relative border-b',
                    hoverRowId === row.id && 'bg-accent/40',
                  )}
                  style={{ height: ROW_HEIGHT }}
                  data-row-id={row.id}
                >
                  {row.items.map((item, itemIndex) => {
                    const s = parseDay(item.start);
                    const e = parseDay(item.end);
                    if (!s || !e) return null;
                    const left = dayToX(s);
                    // Inclusive end: a same-day item still fills one day column
                    const barWidth = Math.max(
                      pxPerDay,
                      (differenceInCalendarDays(e, s) + 1) * pxPerDay,
                    );
                    const color = BAR_COLORS[(rowIndex + itemIndex) % BAR_COLORS.length]!;
                    const isDragging = draggingId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'absolute top-1/2 flex -translate-y-1/2 items-center overflow-hidden rounded-md px-2 text-xs font-medium shadow-sm select-none',
                          color,
                          !readonly && 'cursor-grab active:cursor-grabbing',
                          isDragging && 'z-10 ring-2 ring-foreground/20',
                          readonly && 'opacity-90',
                        )}
                        style={{
                          left,
                          width: barWidth,
                          height: BAR_HEIGHT,
                        }}
                        title={`${item.title} (${item.start} → ${item.end})`}
                        onPointerDown={(ev) => {
                          if (readonly) return;
                          // body drag unless on a handle
                          const target = ev.target as HTMLElement;
                          if (target.dataset.handle) return;
                          startDrag(ev, 'move', item, row.id);
                        }}
                        onClick={() => {
                          if (suppressClickRef.current) {
                            suppressClickRef.current = false;
                            return;
                          }
                          emitClick(item.id);
                        }}
                      >
                        {!readonly ? (
                          <span
                            data-handle="start"
                            className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize hover:bg-white/30"
                            onPointerDown={(ev) => startDrag(ev, 'resize-start', item, row.id)}
                          />
                        ) : null}
                        <span className="truncate px-1">{item.title}</span>
                        {!readonly ? (
                          <span
                            data-handle="end"
                            className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize hover:bg-white/30"
                            onPointerDown={(ev) => startDrag(ev, 'resize-end', item, row.id)}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}

              {rows.length === 0 ? (
                <div
                  className="flex items-center justify-center text-muted-foreground"
                  style={{ height: ROW_HEIGHT * 2 }}
                >
                  No rows
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
