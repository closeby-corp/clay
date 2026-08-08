import { Element } from '@badui/core';

export type GanttItem = {
  id: string;
  title: string;
  /** ISO date `YYYY-MM-DD` (or parseable datetime). */
  start: string;
  /** ISO date `YYYY-MM-DD` (or parseable datetime). */
  end: string;
};

export type GanttRow = {
  id: string;
  title: string;
  items: GanttItem[];
};

export type GanttMarker = {
  id: string;
  /** ISO date `YYYY-MM-DD` (or parseable datetime). */
  date: string;
  label?: string;
};

export type GanttRange = {
  start: string;
  end: string;
};

export type GanttItemMovePayload = {
  itemId: string;
  rowId: string;
  start: string;
  end: string;
};

export type GanttProps = {
  rows: GanttRow[];
  markers?: GanttMarker[];
  range?: GanttRange;
  /** When true, bars are not draggable/resizable. */
  readonly?: boolean;
  className?: string;
  onItemMove?: (payload: GanttItemMovePayload) => void;
  onItemClick?: (itemId: string) => void;
};

/**
 * Project timeline with sidebar labels, bars, today + custom markers.
 * Drag move/resize when not `readonly`; emits `itemMove` on pointer-up.
 */
export function gantt(props: GanttProps): Element {
  return new Element('gantt', {
    rows: props.rows ?? [],
    markers: props.markers,
    range: props.range,
    readonly: props.readonly ?? false,
    className: props.className,
    onItemMove: props.onItemMove,
    onItemClick: props.onItemClick,
  });
}
