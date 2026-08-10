import { Element } from '@clay/core';

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

/** Finish-to-start style link between two item ids (rendered as an arrow). */
export type GanttDependency = {
  id: string;
  /** Predecessor item id. */
  from: string;
  /** Successor item id. */
  to: string;
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
  /** Finish-to-start links drawn between bars. */
  dependencies?: GanttDependency[];
  range?: GanttRange;
  /** When true, bars are not draggable/resizable and markers cannot be created from the chart. */
  readonly?: boolean;
  className?: string;
  /**
   * Fired after the timeline applies the item dates/row to its owned model.
   * Prefer side effects here; start/end/rowId are already updated.
   */
  onItemMove?: (payload: GanttItemMovePayload) => void | Promise<void>;
  onItemClick?: (itemId: string) => void | Promise<void>;
  /**
   * Fired after the timeline appends a marker created from the client
   * (or via settle). Prefer side effects; marker is already in the model.
   */
  onMarkerAdd?: (marker: GanttMarker) => void | Promise<void>;
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

function cloneMarker(m: GanttMarker): GanttMarker {
  return {
    id: m.id,
    date: m.date,
    label: m.label,
  };
}

function cloneMarkers(markers: GanttMarker[]): GanttMarker[] {
  return markers.map(cloneMarker);
}

function cloneDependency(d: GanttDependency): GanttDependency {
  return {
    id: d.id,
    from: d.from,
    to: d.to,
  };
}

function cloneDependencies(deps: GanttDependency[]): GanttDependency[] {
  return deps.map(cloneDependency);
}

function cloneRange(range: GanttRange | undefined): GanttRange | undefined {
  if (!range) return undefined;
  return { start: range.start, end: range.end };
}

function dropDepsForItems(
  deps: GanttDependency[],
  itemIds: Set<string>,
): GanttDependency[] {
  return deps.filter((d) => !itemIds.has(d.from) && !itemIds.has(d.to));
}

/**
 * Project timeline with sidebar labels, bars, today + custom markers,
 * and optional dependency arrows. Owns rows / item dates / markers /
 * dependencies (DataTable/Flow-style); default `itemMove` / `markerAdd`
 * settle updates that model before user callbacks. Prefer element APIs
 * instead of wrapping the whole chart in `ui.auto`. Drag move/resize
 * (including cross-row) when not `readonly`.
 */
export class GanttElement extends Element {
  constructor(props: GanttProps = {}) {
    const {
      onItemMove,
      onItemClick,
      onMarkerAdd,
      rows,
      markers,
      dependencies,
      range,
      readonly,
      className,
    } = props;

    super('gantt', {
      rows: cloneRows(rows ?? []),
      markers: markers ? cloneMarkers(markers) : undefined,
      dependencies: dependencies ? cloneDependencies(dependencies) : undefined,
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

    this.on('markerAdd', (value) => {
      const marker = value as GanttMarker;
      if (!marker?.id || !marker.date) return;
      this.addMarker(marker);
    });
    if (onMarkerAdd) {
      this.on('markerAdd', (value) => onMarkerAdd(value as GanttMarker));
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

  addMarker(marker: GanttMarker): this {
    const next = this.getMarkers();
    if (next.some((m) => m.id === marker.id)) return this;
    this.update({ markers: [...next, cloneMarker(marker)] });
    return this;
  }

  removeMarker(markerId: string): this {
    const markers = this.getMarkers();
    const next = markers.filter((m) => m.id !== markerId);
    if (next.length === markers.length) return this;
    this.update({ markers: next });
    return this;
  }

  getDependencies(): GanttDependency[] {
    return cloneDependencies(
      (this.props.dependencies as GanttDependency[] | undefined) ?? [],
    );
  }

  setDependencies(dependencies: GanttDependency[]): this {
    this.update({ dependencies: cloneDependencies(dependencies) });
    return this;
  }

  addDependency(dependency: GanttDependency): this {
    const next = this.getDependencies();
    if (next.some((d) => d.id === dependency.id)) return this;
    if (dependency.from === dependency.to) return this;
    this.update({ dependencies: [...next, cloneDependency(dependency)] });
    return this;
  }

  removeDependency(dependencyId: string): this {
    const deps = this.getDependencies();
    const next = deps.filter((d) => d.id !== dependencyId);
    if (next.length === deps.length) return this;
    this.update({ dependencies: next });
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
    const deps = this.getDependencies();
    const nextDeps = dropDepsForItems(deps, new Set([itemId]));
    this.update({
      rows: next,
      ...(nextDeps.length !== deps.length ? { dependencies: nextDeps } : {}),
    });
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
    const doomed = rows.find((r) => r.id === rowId);
    if (!doomed) return this;
    const next = rows.filter((r) => r.id !== rowId);
    const itemIds = new Set(doomed.items.map((i) => i.id));
    const deps = this.getDependencies();
    const nextDeps = dropDepsForItems(deps, itemIds);
    this.update({
      rows: next,
      ...(nextDeps.length !== deps.length ? { dependencies: nextDeps } : {}),
    });
    return this;
  }
}

/**
 * Project timeline with sidebar labels, bars, today + custom markers,
 * and optional dependency arrows. Drag move/resize (including cross-row)
 * when not `readonly`; emits `itemMove` on pointer-up.
 */
export function gantt(props: GanttProps = {}): GanttElement {
  return new GanttElement(props);
}
