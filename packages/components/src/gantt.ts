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
  rows?: GanttRow[];
  markers?: GanttMarker[];
  range?: GanttRange;
  /** When true, bars are not draggable/resizable. */
  readonly?: boolean;
  className?: string;
  /**
   * Fired after the timeline applies the item dates to its owned model.
   * Prefer side effects here; start/end are already updated.
   */
  onItemMove?: (payload: GanttItemMovePayload) => void | Promise<void>;
  onItemClick?: (itemId: string) => void | Promise<void>;
};

function cloneItem(item: GanttItem): GanttItem {
  return {
    id: item.id,
    title: item.title,
    start: item.start,
    end: item.end,
  };
}

function cloneRows(rows: GanttRow[]): GanttRow[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    items: row.items.map(cloneItem),
  }));
}

function cloneMarkers(markers: GanttMarker[]): GanttMarker[] {
  return markers.map((m) => ({
    id: m.id,
    date: m.date,
    label: m.label,
  }));
}

function cloneRange(range: GanttRange | undefined): GanttRange | undefined {
  if (!range) return undefined;
  return { start: range.start, end: range.end };
}

/**
 * Project timeline with sidebar labels, bars, today + custom markers.
 * Owns rows / item dates (DataTable/Flow-style); default `itemMove` settle
 * updates that model before user callbacks. Prefer element APIs instead of
 * wrapping the whole chart in `ui.auto`. Drag move/resize when not `readonly`.
 */
export class GanttElement extends Element {
  constructor(props: GanttProps = {}) {
    const { onItemMove, onItemClick, rows, markers, range, readonly, className } =
      props;

    super('gantt', {
      rows: cloneRows(rows ?? []),
      markers: markers ? cloneMarkers(markers) : undefined,
      range: cloneRange(range),
      readonly: readonly ?? false,
      className,
    });

    // Always register settle events so the client emits them; update owned
    // model first, then chain user callbacks for side effects.
    this.on('itemMove', (value) => {
      const payload = value as GanttItemMovePayload;
      if (!payload?.itemId || !payload.start || !payload.end) return;
      this.moveItem(payload);
    });
    if (onItemMove) {
      this.on('itemMove', (value) => onItemMove(value as GanttItemMovePayload));
    }
    if (onItemClick) {
      this.on('itemClick', (value) => onItemClick(value as string));
    }
  }

  getRows(): GanttRow[] {
    return cloneRows((this.props.rows as GanttRow[] | undefined) ?? []);
  }

  setRows(rows: GanttRow[]): this {
    this.update({ rows: cloneRows(rows) });
    return this;
  }

  getMarkers(): GanttMarker[] {
    return cloneMarkers((this.props.markers as GanttMarker[] | undefined) ?? []);
  }

  setMarkers(markers: GanttMarker[]): this {
    this.update({ markers: cloneMarkers(markers) });
    return this;
  }

  getRange(): GanttRange | undefined {
    return cloneRange(this.props.range as GanttRange | undefined);
  }

  setRange(range: GanttRange | undefined): this {
    this.update({ range: cloneRange(range) ?? null });
    return this;
  }

  isReadonly(): boolean {
    return !!this.props.readonly;
  }

  setReadonly(readonly: boolean): this {
    this.update({ readonly });
    return this;
  }

  /** Update an item's start/end (and optionally row) and patch owned `rows`. */
  moveItem(payload: GanttItemMovePayload): this {
    const { itemId, rowId, start, end } = payload;
    if (!itemId || !start || !end) return this;

    const next = this.getRows();
    let found: { row: GanttRow; item: GanttItem; index: number } | null = null;
    for (const row of next) {
      const index = row.items.findIndex((i) => i.id === itemId);
      if (index >= 0) {
        found = { row, item: row.items[index]!, index };
        break;
      }
    }
    if (!found) return this;

    const updated: GanttItem = {
      ...found.item,
      start,
      end,
    };

    // Same row: just patch dates. Different rowId: move the bar between rows.
    if (!rowId || rowId === found.row.id) {
      found.row.items[found.index] = updated;
    } else {
      const target = next.find((r) => r.id === rowId);
      if (!target) {
        found.row.items[found.index] = updated;
      } else {
        found.row.items.splice(found.index, 1);
        target.items.push(updated);
      }
    }

    this.update({ rows: next });
    return this;
  }

  addItem(rowId: string, item: GanttItem, index?: number): this {
    const next = this.getRows();
    const row = next.find((r) => r.id === rowId);
    if (!row) return this;
    if (next.some((r) => r.items.some((i) => i.id === item.id))) return this;
    const insertAt =
      index === undefined
        ? row.items.length
        : Math.max(0, Math.min(index, row.items.length));
    row.items.splice(insertAt, 0, cloneItem(item));
    this.update({ rows: next });
    return this;
  }

  removeItem(itemId: string): this {
    const next = this.getRows();
    let found = false;
    for (const row of next) {
      const idx = row.items.findIndex((i) => i.id === itemId);
      if (idx >= 0) {
        row.items.splice(idx, 1);
        found = true;
        break;
      }
    }
    if (!found) return this;
    this.update({ rows: next });
    return this;
  }

  addRow(row: GanttRow, index?: number): this {
    const next = this.getRows();
    if (next.some((r) => r.id === row.id)) return this;
    const insertAt =
      index === undefined
        ? next.length
        : Math.max(0, Math.min(index, next.length));
    next.splice(insertAt, 0, {
      id: row.id,
      title: row.title,
      items: row.items.map(cloneItem),
    });
    this.update({ rows: next });
    return this;
  }

  removeRow(rowId: string): this {
    const rows = this.getRows();
    const next = rows.filter((r) => r.id !== rowId);
    if (next.length === rows.length) return this;
    this.update({ rows: next });
    return this;
  }
}

/**
 * Project timeline with sidebar labels, bars, today + custom markers.
 * Drag move/resize when not `readonly`; emits `itemMove` on pointer-up.
 */
export function gantt(props: GanttProps = {}): GanttElement {
  return new GanttElement(props);
}
