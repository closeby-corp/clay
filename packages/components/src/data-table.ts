import { Element, withDetached, withParent } from '@badui/core';
import type { ElementNode } from '@badui/core';

export type TableColumnEditor = 'text' | 'select' | 'number' | 'date' | 'boolean';

/** Row / cell spacing. */
export type DataTableDensity = 'compact' | 'default' | 'comfortable';

/** Per-column filter UI. `'facet'` is multi-select exact match for enum-like values. */
export type TableColumnFilter = 'text' | 'facet';

/** Sticky column edge while the table scrolls horizontally. */
export type TableColumnPin = 'left' | 'right';

/** Built-in footer aggregate, or a custom reducer over the aggregate row set. */
export type TableColumnAggregate =
  | 'sum'
  | 'avg'
  | 'count'
  | 'min'
  | 'max'
  | ((rows: Record<string, unknown>[], col: TableColumn) => unknown);

export type DataTableSortDir = 'asc' | 'desc';

/** Ordered multi-sort entry. First entry is primary. */
export type DataTableSort = { key: string; dir: DataTableSortDir };

export type DataTableFacetOption = {
  value: string;
  label: string;
  /** Distinct-row count under current view + other filters (server-computed). */
  count?: number;
};

export type TableColumn = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  /** Defaults to true when omitted. */
  sortable?: boolean;
  /**
   * Column filter mode. Default `'text'` (substring).
   * `'facet'` enables multi-select exact match; options come from `facetOptions` or distinct values.
   */
  filter?: TableColumnFilter;
  /**
   * Facet choices. When set without `filter`, implies `filter: 'facet'`.
   * When `filter: 'facet'` and omitted, distinct values are derived from rows.
   */
  facetOptions?: { value: string; label: string }[];
  /** Derived scalar for sort / filter / export / default display. */
  value?: (row: Record<string, unknown>) => unknown;
  /** Optional cell UI; may return an Element (e.g. ui.badge) or a scalar. */
  render?: (row: Record<string, unknown>) => unknown;
  /**
   * Inline editor chrome on the client.
   * `'number'` commits a finite number; `'date'` an ISO `YYYY-MM-DD` string;
   * `'boolean'` a boolean (switch).
   */
  editor?: TableColumnEditor;
  /** Options when `editor` is `'select'`. */
  editorOptions?: { value: string; label: string }[];
  /** Render this cell as a link that opens the row detail drawer. */
  detailTrigger?: boolean;
  /**
   * Footer aggregate over the aggregate row set (filtered rows in local mode;
   * provided / current-page rows when `manualPagination` is true).
   */
  aggregate?: TableColumnAggregate;
  /** Pin this column while scrolling horizontally. */
  pin?: TableColumnPin;
};

export type DataTableAction = {
  id: string;
  label: string;
  /** Lucide icon name (`Pencil`, `trash-2`, …). */
  icon?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};

export type DataTableView = {
  id: string;
  label: string;
  /** Optional badge override; when omitted, derived from matching rows. */
  count?: number;
  /** Display lens over sourceRows while this view is active. */
  filter?: (row: Record<string, unknown>) => boolean;
};

export type DataTablePrimaryAction = {
  id?: string;
  label: string;
};

/** Client-facing group metadata (no callbacks). */
export type DataTableGroup = {
  key: string;
  label: string;
  count: number;
};

export type ExportFormat = 'csv' | 'tsv' | 'json';
export type ExportMode = 'download' | 'copy';

export type DataTableProps = {
  columns?: TableColumn[];
  className?: string;
  keyField?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Page size; `0` disables pagination. Default `10`. */
  pageSize?: number;
  /** Rows-per-page options in the footer select. */
  pageSizeOptions?: number[];
  /**
   * When true, `data` / `setRows` are treated as the **current page** only.
   * Local filter/sort/group/slice are skipped (same as enabling both
   * `manualFiltering` and `manualSorting`). Use `totalRows` for the pager and
   * listen to `page` / `pageSize` / filter / sort events to fetch, then
   * `setRows` / `setTotalRows`.
   */
  manualPagination?: boolean;
  /**
   * When true, do not apply local search/column filters; keep filter state in
   * props and emit `filter` / `columnFilter` (and `onFilterChange` /
   * `onColumnFilterChange`) so the app can fetch. Defaults to true when
   * `manualPagination` is set.
   */
  manualFiltering?: boolean;
  /**
   * When true, do not apply local sort; keep `sorts` / `sortKey` / `sortDir` in
   * props and emit `sort` (and `onSortChange`) so the app can fetch. Defaults to
   * true when `manualPagination` is set.
   */
  manualSorting?: boolean;
  /**
   * Total row count across all pages. Used when `manualPagination` is true
   * (otherwise derived from the processed local row set). Also settable via `setTotalRows`.
   */
  totalRows?: number;
  /** Initial multi-sort (ordered). Also mirrored as `sortKey` / `sortDir` from the first entry. */
  defaultSorts?: DataTableSort[];
  /** Row density. Default `'default'`. */
  density?: DataTableDensity;
  /** Alternate-row striping. Default `false`. */
  zebra?: boolean;
  actions?: DataTableAction[];
  onAction?: (actionId: string, row: Record<string, unknown>) => void | Promise<void>;
  /** Toolbar actions applied to the current selection (requires `selectable`). */
  bulkActions?: DataTableAction[];
  onBulkAction?: (
    actionId: string,
    rowKeys: Array<string | number>,
  ) => void | Promise<void>;
  /** Show per-column filters (text row and/or facet popovers). Default `true`. */
  columnFilterable?: boolean;
  /** Show Columns visibility menu. Default `true`. */
  columnToggle?: boolean;
  /** Show Export menu. Default `true`. */
  exportable?: boolean;
  /** Base filename without extension. Default `'data'`. */
  exportFilename?: string;
  /** When true, the client shows a loading state in the table body. */
  loading?: boolean;
  /** Empty-state title. Default `'No rows'`. */
  emptyTitle?: string;
  /** Empty-state description. */
  emptyDescription?: string;
  selectable?: boolean;
  reorderable?: boolean;
  views?: DataTableView[];
  defaultView?: string;
  /**
   * Group rows by a column key or a derived value.
   * After filter/sort, rows are partitioned so each group is contiguous.
   * Ignored when `manualPagination` is true (rows are shown as supplied).
   */
  groupBy?: string | ((row: Record<string, unknown>) => unknown);
  /** When true, the client starts with every group collapsed. Default `false`. */
  defaultCollapsed?: boolean;
  primaryAction?: DataTablePrimaryAction;
  /** Build detached Element tree stamped as `__detail` for the drawer. */
  detail?: (row: Record<string, unknown>) => void;
  onReorder?: (orderedKeys: Array<string | number>) => void | Promise<void>;
  onSelectionChange?: (keys: Array<string | number>) => void | Promise<void>;
  onPageChange?: (page: number) => void | Promise<void>;
  onPageSizeChange?: (pageSize: number) => void | Promise<void>;
  /** After sort changes (single or multi). Prefer this in manual/remote mode. */
  onSortChange?: (sorts: DataTableSort[]) => void | Promise<void>;
  /** After global search text changes. Prefer this in manual/remote mode. */
  onFilterChange?: (filter: string) => void | Promise<void>;
  /** After per-column filters change (full map). Prefer this in manual/remote mode. */
  onColumnFilterChange?: (filters: Record<string, string>) => void | Promise<void>;
  onCellChange?: (
    rowKey: string | number,
    columnKey: string,
    value: unknown,
  ) => void | Promise<void>;
  onViewChange?: (viewId: string) => void | Promise<void>;
  onGroupToggle?: (groupKey: string, collapsed: boolean) => void | Promise<void>;
  onPrimaryAction?: () => void | Promise<void>;
};

/** Reserved row identity when `keyField` is omitted. Never inferred as a visible column. */
export const ROW_ID_FIELD = '__rowId';

/** Per-row display map for the client (scalars or `{ __ui: ElementNode }`). */
export const CELLS_FIELD = '__cells';

/** Per-row detail drawer tree (`{ __ui: ElementNode }`). */
export const DETAIL_FIELD = '__detail';

/** Per-row group identity stamped for the client when `groupBy` is set. */
export const GROUP_KEY_FIELD = '__groupKey';

export type UiCell = { __ui: ElementNode };

type SortDir = DataTableSortDir;

type SortPayload = {
  key?: string;
  dir?: SortDir;
  /** When true (shift-click), add/update this column in the multi-sort list. */
  multi?: boolean;
  /** Explicit replace of the full ordered sort list. */
  sorts?: DataTableSort[];
};
type ActionPayload = { actionId?: string; rowKey?: string | number };
type BulkActionPayload = { actionId?: string; rowKeys?: Array<string | number> };
type ColumnFilterPayload = { key?: string; value?: string };
type ColumnVisibilityPayload = { key?: string; visible?: boolean };
type ColumnPinPayload = { key?: string; pin?: TableColumnPin | null | false };
type ExportPayload = { format?: ExportFormat; mode?: ExportMode };
type ReorderPayload = { orderedKeys?: Array<string | number> };
type SelectionPayload = { keys?: Array<string | number> };
type PageSizePayload = { pageSize?: number };
type CellChangePayload = { rowKey?: string | number; columnKey?: string; value?: unknown };
type ViewPayload = { viewId?: string };
type GroupTogglePayload = { groupKey?: string; collapsed?: boolean };

type NormalizedTable = {
  rows: Record<string, unknown>[];
  inferredColumns: TableColumn[];
};

type ClientColumn = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  filter?: TableColumnFilter;
  facetOptions?: DataTableFacetOption[];
  editor?: TableColumnEditor;
  editorOptions?: { value: string; label: string }[];
  detailTrigger?: boolean;
  pin?: TableColumnPin;
  /** Built-in aggregate name when set (custom functions are opaque to the client). */
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatCellValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function stampRowIds(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row, index) => ({ ...row, [ROW_ID_FIELD]: index }));
}

function inferColumnsFromRows(rows: Record<string, unknown>[]): TableColumn[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]!)
    .filter(
      (key) =>
        key !== ROW_ID_FIELD &&
        key !== CELLS_FIELD &&
        key !== DETAIL_FIELD &&
        key !== GROUP_KEY_FIELD,
    )
    .map((key) => ({ key, header: key, sortable: true }));
}

function formatGroupLabel(value: unknown): string {
  if (value == null || value === '') return '(Empty)';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Resolve the group identity for a row under the active `groupBy`. */
export function resolveGroupValue(
  row: Record<string, unknown>,
  groupBy: string | ((row: Record<string, unknown>) => unknown),
  columns: TableColumn[],
): { key: string; label: string } {
  let raw: unknown;
  if (typeof groupBy === 'function') {
    raw = groupBy(row);
  } else {
    const col = columns.find((c) => c.key === groupBy);
    raw = col ? cellValue(col, row) : row[groupBy];
  }
  const label = formatGroupLabel(raw);
  const key = raw == null || raw === '' ? '' : String(typeof raw === 'object' ? label : raw);
  return { key, label };
}

/** Stable partition: groups ordered by first appearance; row order preserved within each. */
export function groupRows(
  rows: Record<string, unknown>[],
  groupBy: string | ((row: Record<string, unknown>) => unknown),
  columns: TableColumn[],
): { groups: DataTableGroup[]; rows: Record<string, unknown>[] } {
  const order: string[] = [];
  const buckets = new Map<string, { label: string; rows: Record<string, unknown>[] }>();

  for (const row of rows) {
    const { key, label } = resolveGroupValue(row, groupBy, columns);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { label, rows: [] };
      buckets.set(key, bucket);
      order.push(key);
    }
    bucket.rows.push(row);
  }

  const groups: DataTableGroup[] = order.map((key) => {
    const bucket = buckets.get(key)!;
    return { key, label: bucket.label, count: bucket.rows.length };
  });
  const flat = order.flatMap((key) => buckets.get(key)!.rows);
  return { groups, rows: flat };
}

function withSortableDefaults(columns: TableColumn[]): TableColumn[] {
  return columns.map((col) => ({
    ...col,
    sortable: col.sortable !== false,
  }));
}

/** True when the column uses multi-select facet filtering. */
export function isFacetColumn(col: TableColumn): boolean {
  if (col.filter === 'facet') return true;
  if (col.filter === 'text') return false;
  return col.facetOptions != null;
}

/**
 * Facet filter values are stored as a JSON string array in `columnFilters[key]`.
 * Returns `null` when the value is not a facet payload (treat as text filter).
 */
export function parseFacetFilter(value: string): string[] | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith('[')) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.map((v) => String(v));
  } catch {
    return null;
  }
}

export function serializeFacetFilter(values: string[]): string {
  return JSON.stringify(values);
}

function facetCellKey(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function deriveFacetOptions(
  col: TableColumn,
  rows: Record<string, unknown>[],
): DataTableFacetOption[] {
  if (col.facetOptions && col.facetOptions.length > 0) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const key = facetCellKey(cellValue(col, row));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return col.facetOptions.map((opt) => ({
      value: opt.value,
      label: opt.label,
      count: counts.get(opt.value) ?? 0,
    }));
  }

  const order: string[] = [];
  const labels = new Map<string, string>();
  const counts = new Map<string, number>();
  for (const row of rows) {
    const raw = cellValue(col, row);
    const key = facetCellKey(raw);
    if (!labels.has(key)) {
      labels.set(key, formatGroupLabel(raw));
      order.push(key);
    }
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return order.map((value) => ({
    value,
    label: labels.get(value) ?? value,
    count: counts.get(value) ?? 0,
  }));
}

function toClientColumns(
  columns: TableColumn[],
  facetRowsByKey?: Map<string, Record<string, unknown>[]>,
): ClientColumn[] {
  return columns.map((col) => {
    const filter: TableColumnFilter | undefined = isFacetColumn(col)
      ? 'facet'
      : col.filter === 'text'
        ? 'text'
        : undefined;
    const facetOptions =
      filter === 'facet'
        ? deriveFacetOptions(col, facetRowsByKey?.get(col.key) ?? [])
        : undefined;
    return {
      key: col.key,
      header: col.header,
      align: col.align,
      sortable: col.sortable,
      filter,
      facetOptions,
      editor: col.editor,
      editorOptions: col.editorOptions,
      detailTrigger: col.detailTrigger,
      pin: col.pin === 'left' || col.pin === 'right' ? col.pin : undefined,
      aggregate:
        col.aggregate === 'sum' ||
        col.aggregate === 'avg' ||
        col.aggregate === 'count' ||
        col.aggregate === 'min' ||
        col.aggregate === 'max'
          ? col.aggregate
          : undefined,
    };
  });
}

/** Scalar used for sort / filter / export / default display. */
export function cellValue(col: TableColumn, row: Record<string, unknown>): unknown {
  return col.value ? col.value(row) : row[col.key];
}

function buildCellDisplay(col: TableColumn, row: Record<string, unknown>): unknown {
  if (col.render) {
    const result = withDetached(() => col.render!(row));
    if (result instanceof Element) {
      const node = result.toJSON();
      result.destroy();
      return { __ui: node } satisfies UiCell;
    }
    return result;
  }
  return cellValue(col, row);
}

function buildDetailDisplay(
  row: Record<string, unknown>,
  detailFn: (row: Record<string, unknown>) => void,
): UiCell {
  const root = new Element('column', { gap: 4 });
  withDetached(() => {
    withParent(root, () => detailFn(row));
  });
  const node = root.toJSON();
  root.destroy();
  return { __ui: node };
}

function buildDisplayRow(
  row: Record<string, unknown>,
  columns: TableColumn[],
  detailFn?: (row: Record<string, unknown>) => void,
): Record<string, unknown> {
  const cells: Record<string, unknown> = {};
  for (const col of columns) {
    cells[col.key] = buildCellDisplay(col, row);
  }
  const out: Record<string, unknown> = { ...row, [CELLS_FIELD]: cells };
  if (detailFn) {
    out[DETAIL_FIELD] = buildDetailDisplay(row, detailFn);
  }
  return out;
}

function projectExportRows(
  rows: Record<string, unknown>[],
  columns: TableColumn[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const col of columns) {
      out[col.key] = cellValue(col, row);
    }
    return out;
  });
}

/** Normalize arrays, plain objects, and primitives into stamped rows + inferred columns. */
export function normalizeTableData(data: unknown): NormalizedTable {
  if (data == null) {
    return { rows: [], inferredColumns: [] };
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { rows: [], inferredColumns: [] };
    }

    if (data.every(isPlainObject)) {
      const rows = stampRowIds(data.map((row) => ({ ...row })));
      return { rows, inferredColumns: inferColumnsFromRows(rows) };
    }

    const rows = stampRowIds(
      data.map((value) => ({
        value: formatCellValue(value),
      })),
    );
    return {
      rows,
      inferredColumns: [{ key: 'value', header: 'Value', sortable: true }],
    };
  }

  if (isPlainObject(data)) {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return { rows: [], inferredColumns: [] };
    }
    const rows = stampRowIds(
      entries.map(([key, value]) => ({
        key,
        value: formatCellValue(value),
      })),
    );
    return {
      rows,
      inferredColumns: [
        { key: 'key', header: 'Key', sortable: true },
        { key: 'value', header: 'Value', sortable: true },
      ],
    };
  }

  const rows = stampRowIds([{ value: data }]);
  return {
    rows,
    inferredColumns: [{ key: 'value', header: 'Value', sortable: true }],
  };
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

function normalizeSorts(
  sorts: DataTableSort[] | undefined,
  columns: TableColumn[],
): DataTableSort[] {
  if (!sorts || sorts.length === 0) return [];
  const keys = new Set(columns.map((c) => c.key));
  const out: DataTableSort[] = [];
  const seen = new Set<string>();
  for (const entry of sorts) {
    if (!entry?.key || !keys.has(entry.key) || seen.has(entry.key)) continue;
    const col = columns.find((c) => c.key === entry.key);
    if (!col || col.sortable === false) continue;
    seen.add(entry.key);
    out.push({ key: entry.key, dir: entry.dir === 'desc' ? 'desc' : 'asc' });
  }
  return out;
}

function sortRowsBySorts(
  rows: Record<string, unknown>[],
  sorts: DataTableSort[],
  columns: TableColumn[],
): Record<string, unknown>[] {
  if (sorts.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const { key, dir } of sorts) {
      const col = columns.find((c) => c.key === key);
      const av = col ? cellValue(col, a) : a[key];
      const bv = col ? cellValue(col, b) : b[key];
      const cmp = compareValues(av, bv);
      if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatAggregateValue(value: unknown): unknown {
  if (value == null) return '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    return Number.isInteger(value) ? value : Math.round(value * 100) / 100;
  }
  return value;
}

/** Compute a single column aggregate over `rows`. */
export function computeColumnAggregate(
  col: TableColumn,
  rows: Record<string, unknown>[],
): unknown {
  if (!col.aggregate) return null;
  if (typeof col.aggregate === 'function') {
    return formatAggregateValue(col.aggregate(rows, col));
  }
  if (col.aggregate === 'count') {
    return rows.length;
  }
  const nums = rows
    .map((row) => toFiniteNumber(cellValue(col, row)))
    .filter((n): n is number => n != null);
  if (col.aggregate === 'sum') {
    return formatAggregateValue(nums.reduce((acc, n) => acc + n, 0));
  }
  if (col.aggregate === 'avg') {
    if (nums.length === 0) return '';
    return formatAggregateValue(nums.reduce((acc, n) => acc + n, 0) / nums.length);
  }
  if (col.aggregate === 'min') {
    if (nums.length === 0) return '';
    return formatAggregateValue(Math.min(...nums));
  }
  if (col.aggregate === 'max') {
    if (nums.length === 0) return '';
    return formatAggregateValue(Math.max(...nums));
  }
  return null;
}

/** Visible-column order with left pins first and right pins last. */
export function orderColumnsByPin(columns: TableColumn[]): TableColumn[] {
  const left: TableColumn[] = [];
  const middle: TableColumn[] = [];
  const right: TableColumn[] = [];
  for (const col of columns) {
    if (col.pin === 'left') left.push(col);
    else if (col.pin === 'right') right.push(col);
    else middle.push(col);
  }
  return [...left, ...middle, ...right];
}

function rowMatchesGlobalFilter(
  row: Record<string, unknown>,
  columns: TableColumn[],
  filter: string,
): boolean {
  const q = filter.trim().toLowerCase();
  if (!q) return true;
  return columns.some((col) => String(cellValue(col, row) ?? '').toLowerCase().includes(q));
}

function rowMatchesColumnFilters(
  row: Record<string, unknown>,
  columns: TableColumn[],
  columnFilters: Record<string, string>,
): boolean {
  for (const [key, value] of Object.entries(columnFilters)) {
    if (value.trim() === '') continue;
    const col = columns.find((c) => c.key === key);
    const cell = col ? cellValue(col, row) : row[key];
    if (col && isFacetColumn(col)) {
      const selected = parseFacetFilter(value) ?? [];
      if (selected.length === 0) continue;
      if (!selected.includes(facetCellKey(cell))) return false;
      continue;
    }
    const q = value.trim().toLowerCase();
    if (!String(cell ?? '').toLowerCase().includes(q)) return false;
  }
  return true;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function cellToExportString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function rowsToDelimited(
  rows: Record<string, unknown>[],
  columns: TableColumn[],
  delimiter: string,
): string {
  const header = columns.map((c) => escapeCsvField(c.header)).join(delimiter);
  const body = rows.map((row) =>
    columns.map((c) => escapeCsvField(cellToExportString(row[c.key]))).join(delimiter),
  );
  return [header, ...body].join('\n');
}

export function rowsToCsv(rows: Record<string, unknown>[], columns: TableColumn[]): string {
  return rowsToDelimited(rows, columns, ',');
}

export function rowsToTsv(rows: Record<string, unknown>[], columns: TableColumn[]): string {
  return rowsToDelimited(rows, columns, '\t');
}

export function rowsToJson(rows: Record<string, unknown>[], columns: TableColumn[]): string {
  const projected = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const col of columns) {
      out[col.key] = row[col.key] ?? null;
    }
    return out;
  });
  return JSON.stringify(projected, null, 2);
}

function mimeForFormat(format: ExportFormat): string {
  if (format === 'csv') return 'text/csv;charset=utf-8';
  if (format === 'tsv') return 'text/tab-separated-values;charset=utf-8';
  return 'application/json;charset=utf-8';
}

function extensionForFormat(format: ExportFormat): string {
  return format;
}

export class DataTableElement extends Element {
  private sourceRows: Record<string, unknown>[];
  private columns: TableColumn[];
  private columnsExplicit: boolean;
  private keyField: string;
  private sorts: DataTableSort[] = [];
  private filter = '';
  private columnFilters: Record<string, string> = {};
  private hiddenKeys = new Set<string>();
  private page = 1;
  private pageSize: number;
  private pageSizeOptions: number[];
  private manualPagination: boolean;
  private manualFiltering: boolean;
  private manualSorting: boolean;
  private manualTotalRows: number | null;
  private density: DataTableDensity;
  private zebra: boolean;
  private searchable: boolean;
  private searchPlaceholder: string;
  private columnFilterable: boolean;
  private columnToggle: boolean;
  private exportable: boolean;
  private exportFilename: string;
  private loading: boolean;
  private emptyTitle: string;
  private emptyDescription: string;
  private selectable: boolean;
  private reorderable: boolean;
  private views: DataTableView[];
  private activeView: string;
  private groupBy?: string | ((row: Record<string, unknown>) => unknown);
  private defaultCollapsed: boolean;
  private primaryAction?: DataTablePrimaryAction;
  private detailFn?: (row: Record<string, unknown>) => void;
  private actions: DataTableAction[];
  private bulkActions: DataTableAction[];
  private onActionFn?: (actionId: string, row: Record<string, unknown>) => void | Promise<void>;
  private onBulkActionFn?: (
    actionId: string,
    rowKeys: Array<string | number>,
  ) => void | Promise<void>;
  private onReorderFn?: (orderedKeys: Array<string | number>) => void | Promise<void>;
  private onSelectionChangeFn?: (keys: Array<string | number>) => void | Promise<void>;
  private onPageChangeFn?: (page: number) => void | Promise<void>;
  private onPageSizeChangeFn?: (pageSize: number) => void | Promise<void>;
  private onSortChangeFn?: (sorts: DataTableSort[]) => void | Promise<void>;
  private onFilterChangeFn?: (filter: string) => void | Promise<void>;
  private onColumnFilterChangeFn?: (filters: Record<string, string>) => void | Promise<void>;
  private onCellChangeFn?: (
    rowKey: string | number,
    columnKey: string,
    value: unknown,
  ) => void | Promise<void>;
  private onViewChangeFn?: (viewId: string) => void | Promise<void>;
  private onGroupToggleFn?: (groupKey: string, collapsed: boolean) => void | Promise<void>;
  private onPrimaryActionFn?: () => void | Promise<void>;

  constructor(data: unknown = [], props: DataTableProps = {}) {
    const columnsExplicit = props.columns !== undefined;
    const { rows, inferredColumns } = normalizeTableData(data);
    const columns = withSortableDefaults(columnsExplicit ? props.columns! : inferredColumns);
    const searchable = props.searchable !== false;
    const pageSize = props.pageSize ?? 10;
    const pageSizeOptions = props.pageSizeOptions ?? [10, 20, 30, 40, 50];
    const manualPagination = props.manualPagination === true;
    const manualFiltering =
      props.manualFiltering === true ||
      (manualPagination && props.manualFiltering !== false);
    const manualSorting =
      props.manualSorting === true || (manualPagination && props.manualSorting !== false);
    const manualTotalRows =
      props.totalRows != null && Number.isFinite(props.totalRows)
        ? Math.max(0, Math.floor(Number(props.totalRows)))
        : null;
    const density: DataTableDensity =
      props.density === 'compact' || props.density === 'comfortable'
        ? props.density
        : 'default';
    const zebra = props.zebra === true;
    const actions = props.actions ?? [];
    const bulkActions = props.bulkActions ?? [];
    const keyField = props.keyField ?? ROW_ID_FIELD;
    const searchPlaceholder = props.searchPlaceholder ?? 'Search…';
    const columnFilterable = props.columnFilterable !== false;
    const columnToggle = props.columnToggle !== false;
    const exportable = props.exportable !== false;
    const exportFilename = props.exportFilename ?? 'data';
    const loading = props.loading === true;
    const emptyTitle = props.emptyTitle ?? 'No rows';
    const emptyDescription =
      props.emptyDescription ?? 'No matching rows. Try adjusting search or filters.';
    const selectable = props.selectable === true;
    const reorderable = props.reorderable === true;
    const views = props.views ?? [];
    const activeView = props.defaultView ?? views[0]?.id ?? '';
    const groupBy = props.groupBy;
    const defaultCollapsed = props.defaultCollapsed === true;
    const primaryAction = props.primaryAction;
    const initialSorts = normalizeSorts(props.defaultSorts, columns);

    super('datatable', {
      columns: toClientColumns(columns),
      allColumns: toClientColumns(columns),
      rows: [],
      className: props.className,
      keyField,
      searchable,
      searchPlaceholder,
      columnFilterable,
      columnToggle,
      exportable,
      loading,
      emptyTitle,
      emptyDescription,
      selectable,
      reorderable,
      views,
      activeView,
      groupBy: typeof groupBy === 'string' ? groupBy : groupBy ? true : null,
      groups: [],
      defaultCollapsed,
      primaryAction: primaryAction ?? null,
      pageSizeOptions,
      hasDetail: typeof props.detail === 'function',
      actions: actions.map(({ id, label, icon, variant }) => ({ id, label, icon, variant })),
      bulkActions: bulkActions.map(({ id, label, icon, variant }) => ({
        id,
        label,
        icon,
        variant,
      })),
      filter: '',
      columnFilters: {},
      hiddenColumns: [],
      sorts: initialSorts,
      sortKey: initialSorts[0]?.key ?? null,
      sortDir: initialSorts[0]?.dir ?? 'asc',
      page: 1,
      pageSize,
      manualPagination,
      manualFiltering,
      manualSorting,
      density,
      zebra,
      totalRows: 0,
      totalPages: 1,
      footer: null,
    });

    this.sourceRows = rows;
    this.columns = columns;
    this.columnsExplicit = columnsExplicit;
    this.keyField = keyField;
    this.sorts = initialSorts;
    this.pageSize = pageSize;
    this.pageSizeOptions = pageSizeOptions;
    this.manualPagination = manualPagination;
    this.manualFiltering = manualFiltering;
    this.manualSorting = manualSorting;
    this.manualTotalRows = manualTotalRows;
    this.density = density;
    this.zebra = zebra;
    this.searchable = searchable;
    this.searchPlaceholder = searchPlaceholder;
    this.columnFilterable = columnFilterable;
    this.columnToggle = columnToggle;
    this.exportable = exportable;
    this.exportFilename = exportFilename;
    this.loading = loading;
    this.emptyTitle = emptyTitle;
    this.emptyDescription = emptyDescription;
    this.selectable = selectable;
    this.reorderable = reorderable;
    this.views = views;
    this.activeView = activeView;
    this.groupBy = groupBy;
    this.defaultCollapsed = defaultCollapsed;
    this.primaryAction = primaryAction;
    this.detailFn = props.detail;
    this.actions = actions;
    this.bulkActions = bulkActions;
    this.onActionFn = props.onAction;
    this.onBulkActionFn = props.onBulkAction;
    this.onReorderFn = props.onReorder;
    this.onSelectionChangeFn = props.onSelectionChange;
    this.onPageChangeFn = props.onPageChange;
    this.onPageSizeChangeFn = props.onPageSizeChange;
    this.onSortChangeFn = props.onSortChange;
    this.onFilterChangeFn = props.onFilterChange;
    this.onColumnFilterChangeFn = props.onColumnFilterChange;
    this.onCellChangeFn = props.onCellChange;
    this.onViewChangeFn = props.onViewChange;
    this.onGroupToggleFn = props.onGroupToggle;
    this.onPrimaryActionFn = props.onPrimaryAction;

    this.on('sort', (value) => this.handleSort(value));
    this.on('filter', (value) => this.handleFilter(value));
    this.on('columnFilter', (value) => this.handleColumnFilter(value));
    this.on('columnVisibility', (value) => this.handleColumnVisibility(value));
    this.on('columnPin', (value) => this.handleColumnPin(value));
    this.on('export', (value) => this.handleExport(value));
    this.on('page', (value) => this.handlePage(value));
    this.on('action', (value) => this.handleAction(value));
    this.on('bulkAction', (value) => this.handleBulkAction(value));
    this.on('reorder', (value) => this.handleReorder(value));
    this.on('selectionChange', (value) => this.handleSelectionChange(value));
    this.on('pageSize', (value) => this.handlePageSize(value));
    this.on('cellChange', (value) => this.handleCellChange(value));
    this.on('viewChange', (value) => this.handleViewChange(value));
    this.on('groupToggle', (value) => this.handleGroupToggle(value));
    this.on('primaryAction', () => this.handlePrimaryAction());

    this.syncView();
  }

  getRows(): Record<string, unknown>[] {
    return this.sourceRows.map((r) => ({ ...r }));
  }

  /** Toggle the client loading state (spinner in the table body). */
  setLoading(loading: boolean): this {
    this.loading = loading;
    this.syncView();
    return this;
  }

  /**
   * Set the footer total when `manualPagination` is true.
   * Ignored for local (auto) pagination, where totals come from processed rows.
   */
  setTotalRows(total: number): this {
    if (!Number.isFinite(total) || total < 0) return this;
    this.manualTotalRows = Math.floor(total);
    this.syncView();
    return this;
  }

  setDensity(density: DataTableDensity): this {
    this.density =
      density === 'compact' || density === 'comfortable' ? density : 'default';
    this.syncView();
    return this;
  }

  setZebra(zebra: boolean): this {
    this.zebra = zebra === true;
    this.syncView();
    return this;
  }

  /** Replace the ordered multi-sort list. Empty clears sort. */
  setSorts(sorts: DataTableSort[]): this {
    this.sorts = normalizeSorts(sorts, this.columns);
    this.page = 1;
    this.syncView();
    return this;
  }

  getSorts(): DataTableSort[] {
    return this.sorts.map((s) => ({ ...s }));
  }

  setRows(data: unknown): this {
    const { rows, inferredColumns } = normalizeTableData(data);
    this.sourceRows = rows;
    if (!this.columnsExplicit) {
      this.columns = withSortableDefaults(inferredColumns);
      const keys = new Set(this.columns.map((c) => c.key));
      for (const key of Object.keys(this.columnFilters)) {
        if (!keys.has(key)) delete this.columnFilters[key];
      }
      for (const key of [...this.hiddenKeys]) {
        if (!keys.has(key)) this.hiddenKeys.delete(key);
      }
      this.sorts = normalizeSorts(this.sorts, this.columns);
    }
    // Remote pages keep the current page; local mode resets to page 1.
    if (!this.manualPagination) {
      this.page = 1;
    }
    this.syncView();
    return this;
  }

  visibleColumns(): TableColumn[] {
    return orderColumnsByPin(this.columns.filter((col) => !this.hiddenKeys.has(col.key)));
  }

  private async handleSort(value: unknown): Promise<void> {
    const payload = (value ?? {}) as SortPayload;

    if (Array.isArray(payload.sorts)) {
      this.sorts = normalizeSorts(payload.sorts, this.columns);
    } else {
      const key = payload.key;
      if (!key) return;
      const col = this.columns.find((c) => c.key === key);
      if (!col || col.sortable === false) return;
      const dir: SortDir = payload.dir === 'desc' ? 'desc' : 'asc';
      const multi = payload.multi === true;

      if (multi) {
        const idx = this.sorts.findIndex((s) => s.key === key);
        if (idx >= 0) {
          const current = this.sorts[idx]!;
          if (payload.dir == null && current.dir === 'asc') {
            this.sorts = this.sorts.map((s, i) => (i === idx ? { key, dir: 'desc' } : s));
          } else if (payload.dir == null && current.dir === 'desc') {
            this.sorts = this.sorts.filter((_, i) => i !== idx);
          } else if (payload.dir != null && current.dir === payload.dir) {
            // Same dir again while multi → remove from list.
            this.sorts = this.sorts.filter((_, i) => i !== idx);
          } else {
            this.sorts = this.sorts.map((s, i) => (i === idx ? { key, dir } : s));
          }
        } else {
          this.sorts = [...this.sorts, { key, dir }];
        }
      } else if (payload.dir != null) {
        this.sorts = [{ key, dir }];
      } else {
        const current = this.sorts.length === 1 ? this.sorts[0] : null;
        if (current?.key === key) {
          this.sorts = [{ key, dir: current.dir === 'asc' ? 'desc' : 'asc' }];
        } else {
          this.sorts = [{ key, dir: 'asc' }];
        }
      }
    }

    this.page = 1;
    this.syncView();
    if (this.onSortChangeFn) {
      await this.onSortChangeFn(this.getSorts());
    }
  }

  private async handleFilter(value: unknown): Promise<void> {
    this.filter = String(value ?? '');
    this.page = 1;
    this.syncView();
    if (this.onFilterChangeFn) {
      await this.onFilterChangeFn(this.filter);
    }
  }

  private async handleColumnFilter(value: unknown): Promise<void> {
    const payload = (value ?? {}) as ColumnFilterPayload;
    const key = payload.key;
    const col = this.columns.find((c) => c.key === key);
    if (!key || !col) return;
    const next = String(payload.value ?? '');
    if (isFacetColumn(col)) {
      const selected = parseFacetFilter(next) ?? [];
      if (selected.length === 0) {
        delete this.columnFilters[key];
      } else {
        this.columnFilters[key] = serializeFacetFilter(selected);
      }
    } else if (next.trim() === '') {
      delete this.columnFilters[key];
    } else {
      this.columnFilters[key] = next;
    }
    this.page = 1;
    this.syncView();
    if (this.onColumnFilterChangeFn) {
      await this.onColumnFilterChangeFn({ ...this.columnFilters });
    }
  }

  private handleColumnVisibility(value: unknown): void {
    const payload = (value ?? {}) as ColumnVisibilityPayload;
    const key = payload.key;
    if (!key || !this.columns.some((c) => c.key === key)) return;

    if (payload.visible === false) {
      const visibleCount = this.columns.length - this.hiddenKeys.size;
      if (visibleCount <= 1 && !this.hiddenKeys.has(key)) {
        return;
      }
      this.hiddenKeys.add(key);
    } else {
      this.hiddenKeys.delete(key);
    }
    this.syncView();
  }

  private handleColumnPin(value: unknown): void {
    const payload = (value ?? {}) as ColumnPinPayload;
    const key = payload.key;
    const col = this.columns.find((c) => c.key === key);
    if (!key || !col) return;
    const pin = payload.pin;
    if (pin === 'left' || pin === 'right') {
      col.pin = pin;
    } else {
      delete col.pin;
    }
    this.syncView();
  }

  private handleExport(value: unknown): void {
    if (!this.exportable) return;
    const payload = (value ?? {}) as ExportPayload;
    const format = payload.format;
    const mode = payload.mode;
    if (format !== 'csv' && format !== 'tsv' && format !== 'json') return;
    if (mode !== 'download' && mode !== 'copy') return;

    const columns = this.visibleColumns();
    const rows = projectExportRows(this.computeProcessedRows(), columns);
    let content: string;
    if (format === 'csv') content = rowsToCsv(rows, columns);
    else if (format === 'tsv') content = rowsToTsv(rows, columns);
    else content = rowsToJson(rows, columns);

    const session = this.session;
    if (!session) return;

    if (mode === 'download') {
      session.download(
        `${this.exportFilename}.${extensionForFormat(format)}`,
        mimeForFormat(format),
        content,
      );
      session.notify(`Downloaded ${format.toUpperCase()}`, 'success');
    } else {
      session.clipboard(content);
      session.notify(`Copied ${format.toUpperCase()} to clipboard`, 'success');
    }
  }

  private async handlePage(value: unknown): Promise<void> {
    const next = Number(value);
    if (!Number.isFinite(next) || next < 1) return;
    this.page = Math.floor(next);
    this.syncView();
    if (this.onPageChangeFn) {
      await this.onPageChangeFn(this.page);
    }
  }

  private async handleAction(value: unknown): Promise<void> {
    if (!this.onActionFn) return;
    const payload = (value ?? {}) as ActionPayload;
    const actionId = payload.actionId;
    if (!actionId) return;
    const row = this.sourceRows.find((r) => String(r[this.keyField]) === String(payload.rowKey));
    if (!row) return;
    await this.onActionFn(actionId, { ...row });
  }

  private async handleBulkAction(value: unknown): Promise<void> {
    if (!this.onBulkActionFn || !this.selectable) return;
    const payload = (value ?? {}) as BulkActionPayload;
    const actionId = payload.actionId;
    if (!actionId || !this.bulkActions.some((a) => a.id === actionId)) return;
    const rowKeys = payload.rowKeys;
    if (!Array.isArray(rowKeys) || rowKeys.length === 0) return;
    const known = new Set(this.sourceRows.map((r) => String(r[this.keyField])));
    const keys = rowKeys.filter((k) => known.has(String(k)));
    if (keys.length === 0) return;
    await this.onBulkActionFn(actionId, keys);
  }

  /**
   * Global reorder: `orderedKeys` is the new order of the dragged page slice.
   * Those keys keep their positions in the full filtered/sorted list; only their
   * relative order changes. Off-page (and filtered-out) rows stay put.
   */
  private async handleReorder(value: unknown): Promise<void> {
    const payload = (value ?? {}) as ReorderPayload;
    const orderedKeys = payload.orderedKeys;
    if (!Array.isArray(orderedKeys) || orderedKeys.length === 0) return;

    const sliceKeys = orderedKeys.map(String);
    const sliceSet = new Set(sliceKeys);
    if (sliceSet.size !== sliceKeys.length) return;

    const processed = this.computeProcessedRows();
    const processedKeys = processed.map((r) => String(r[this.keyField]));
    const positions: number[] = [];
    for (let i = 0; i < processedKeys.length; i++) {
      if (sliceSet.has(processedKeys[i]!)) positions.push(i);
    }
    if (positions.length !== sliceKeys.length) return;
    const positionSet = new Set(positions.map((i) => processedKeys[i]!));
    if (positionSet.size !== sliceSet.size || ![...sliceSet].every((k) => positionSet.has(k))) {
      return;
    }

    const nextProcessedKeys = [...processedKeys];
    for (let i = 0; i < positions.length; i++) {
      nextProcessedKeys[positions[i]!] = sliceKeys[i]!;
    }

    const byKey = new Map(this.sourceRows.map((r) => [String(r[this.keyField]), r]));
    const next: Record<string, unknown>[] = [];
    const seen = new Set<string>();
    for (const key of nextProcessedKeys) {
      const row = byKey.get(key);
      if (row) {
        next.push(row);
        seen.add(key);
      }
    }
    for (const row of this.sourceRows) {
      const key = String(row[this.keyField]);
      if (!seen.has(key)) next.push(row);
    }

    this.sourceRows = next.map((row, index) =>
      this.keyField === ROW_ID_FIELD ? { ...row, [ROW_ID_FIELD]: index } : row,
    );
    this.syncView();
    if (this.onReorderFn) {
      await this.onReorderFn(orderedKeys);
    }
  }

  private async handleSelectionChange(value: unknown): Promise<void> {
    if (!this.onSelectionChangeFn) return;
    const payload = (value ?? {}) as SelectionPayload;
    const keys = payload.keys;
    if (!Array.isArray(keys)) return;
    await this.onSelectionChangeFn(keys);
  }

  private async handlePageSize(value: unknown): Promise<void> {
    const payload =
      typeof value === 'number' || typeof value === 'string'
        ? { pageSize: Number(value) }
        : ((value ?? {}) as PageSizePayload);
    const next = Number(payload.pageSize);
    if (!Number.isFinite(next) || next < 0) return;
    this.pageSize = Math.floor(next);
    this.page = 1;
    this.syncView();
    if (this.onPageSizeChangeFn) {
      await this.onPageSizeChangeFn(this.pageSize);
    }
  }

  private coerceEditorValue(columnKey: string, value: unknown): unknown {
    const col = this.columns.find((c) => c.key === columnKey);
    if (!col?.editor) return value;
    if (col.editor === 'number') {
      if (value === '' || value == null) return null;
      const n = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(n) ? n : value;
    }
    if (col.editor === 'boolean') {
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === 1 || value === '1') return true;
      if (value === 'false' || value === 0 || value === '0') return false;
      return Boolean(value);
    }
    if (col.editor === 'date') {
      if (value == null || value === '') return null;
      return String(value);
    }
    return value;
  }

  private async handleCellChange(value: unknown): Promise<void> {
    const payload = (value ?? {}) as CellChangePayload;
    if (payload.rowKey == null || !payload.columnKey) return;
    const row = this.sourceRows.find((r) => String(r[this.keyField]) === String(payload.rowKey));
    if (!row) return;
    const next = this.coerceEditorValue(payload.columnKey, payload.value);
    row[payload.columnKey] = next;
    this.syncView();
    if (this.onCellChangeFn) {
      await this.onCellChangeFn(payload.rowKey, payload.columnKey, next);
    }
  }

  private async handleViewChange(value: unknown): Promise<void> {
    const payload =
      typeof value === 'string' ? { viewId: value } : ((value ?? {}) as ViewPayload);
    const viewId = payload.viewId;
    if (!viewId || !this.views.some((v) => v.id === viewId)) return;
    this.activeView = viewId;
    this.page = 1;
    this.syncView();
    if (this.onViewChangeFn) {
      await this.onViewChangeFn(viewId);
    }
  }

  private async handleGroupToggle(value: unknown): Promise<void> {
    if (!this.onGroupToggleFn) return;
    const payload = (value ?? {}) as GroupTogglePayload;
    if (payload.groupKey == null || typeof payload.collapsed !== 'boolean') return;
    await this.onGroupToggleFn(payload.groupKey, payload.collapsed);
  }

  private async handlePrimaryAction(): Promise<void> {
    if (this.onPrimaryActionFn) {
      await this.onPrimaryActionFn();
    }
  }

  private viewFilteredRows(): Record<string, unknown>[] {
    const active = this.views.find((v) => v.id === this.activeView);
    return active?.filter
      ? this.sourceRows.filter((row) => active.filter!(row))
      : this.sourceRows;
  }

  /** Rows used to count facet options for `columnKey` (excludes that column's filter). */
  private facetBaseRows(columnKey: string): Record<string, unknown>[] {
    const filters = { ...this.columnFilters };
    delete filters[columnKey];
    return this.viewFilteredRows().filter(
      (row) =>
        rowMatchesGlobalFilter(row, this.columns, this.filter) &&
        rowMatchesColumnFilters(row, this.columns, filters),
    );
  }

  /**
   * Visible rows after view filter + search/column filters + sort (+ group contiguous).
   * When `manualPagination` is set, returns `sourceRows` unchanged (already a page).
   * When only `manualFiltering` / `manualSorting` are set, those stages are skipped
   * but the other local pipeline stages still run.
   */
  computeProcessedRows(): Record<string, unknown>[] {
    if (this.manualPagination) {
      return this.sourceRows;
    }
    let rows = this.viewFilteredRows();
    if (!this.manualFiltering) {
      rows = rows.filter(
        (row) =>
          rowMatchesGlobalFilter(row, this.columns, this.filter) &&
          rowMatchesColumnFilters(row, this.columns, this.columnFilters),
      );
    }
    if (!this.manualSorting && this.sorts.length > 0) {
      rows = sortRowsBySorts(rows, this.sorts, this.columns);
    }
    if (this.groupBy) {
      rows = groupRows(rows, this.groupBy, this.columns).rows;
    }
    return rows;
  }

  /** Rows used for footer aggregates (filtered set locally; provided rows when remote-paged). */
  private aggregateRows(): Record<string, unknown>[] {
    if (this.manualPagination) {
      return this.sourceRows;
    }
    return this.computeProcessedRows();
  }

  private buildFooter(
    visibleCols: TableColumn[],
    rows: Record<string, unknown>[],
  ): Record<string, unknown> | null {
    const hasAny = visibleCols.some((col) => col.aggregate != null);
    if (!hasAny) return null;
    const footer: Record<string, unknown> = {};
    for (const col of visibleCols) {
      if (col.aggregate == null) continue;
      footer[col.key] = computeColumnAggregate(col, rows);
    }
    return footer;
  }

  private clientViews(): Array<{ id: string; label: string; count: number }> {
    return this.views.map((view) => ({
      id: view.id,
      label: view.label,
      count:
        view.count ??
        this.sourceRows.filter((row) => (view.filter ? view.filter(row) : true)).length,
    }));
  }

  syncView(): void {
    const processed = this.computeProcessedRows();
    const totalRows = this.manualPagination
      ? (this.manualTotalRows ?? processed.length)
      : processed.length;
    const totalPages =
      this.pageSize > 0 ? Math.max(1, Math.ceil(totalRows / this.pageSize) || 1) : 1;
    if (this.page > totalPages) this.page = totalPages;
    if (this.page < 1) this.page = 1;

    // Manual mode: rows are already the current page — do not slice.
    const pageRows = this.manualPagination
      ? processed
      : this.pageSize > 0
        ? processed.slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize)
        : processed;
    const visibleCols = this.visibleColumns();
    const groups =
      this.groupBy && !this.manualPagination
        ? groupRows(processed, this.groupBy, this.columns).groups
        : [];
    const visible = pageRows.map((row) => {
      const display = buildDisplayRow(row, visibleCols, this.detailFn);
      if (this.groupBy && !this.manualPagination) {
        display[GROUP_KEY_FIELD] = resolveGroupValue(row, this.groupBy, this.columns).key;
      }
      return display;
    });

    const facetRowsByKey = new Map<string, Record<string, unknown>[]>();
    for (const col of this.columns) {
      if (isFacetColumn(col)) {
        facetRowsByKey.set(
          col.key,
          this.manualFiltering || this.manualPagination
            ? this.sourceRows
            : this.facetBaseRows(col.key),
        );
      }
    }

    const footer = this.buildFooter(visibleCols, this.aggregateRows());
    const sorts = this.sorts.map((s) => ({ ...s }));

    this.update({
      columns: toClientColumns(visibleCols, facetRowsByKey),
      allColumns: toClientColumns(this.columns, facetRowsByKey),
      rows: visible,
      filter: this.filter,
      columnFilters: { ...this.columnFilters },
      hiddenColumns: [...this.hiddenKeys],
      sorts,
      sortKey: sorts[0]?.key ?? null,
      sortDir: sorts[0]?.dir ?? 'asc',
      page: this.page,
      pageSize: this.pageSize,
      pageSizeOptions: this.pageSizeOptions,
      manualPagination: this.manualPagination,
      manualFiltering: this.manualFiltering,
      manualSorting: this.manualSorting,
      density: this.density,
      zebra: this.zebra,
      totalRows,
      totalPages,
      footer,
      searchable: this.searchable,
      searchPlaceholder: this.searchPlaceholder,
      columnFilterable: this.columnFilterable,
      columnToggle: this.columnToggle,
      exportable: this.exportable,
      loading: this.loading,
      emptyTitle: this.emptyTitle,
      emptyDescription: this.emptyDescription,
      selectable: this.selectable,
      reorderable: this.reorderable,
      views: this.clientViews(),
      activeView: this.activeView,
      groupBy:
        this.manualPagination
          ? null
          : typeof this.groupBy === 'string'
            ? this.groupBy
            : this.groupBy
              ? true
              : null,
      groups,
      defaultCollapsed: this.defaultCollapsed,
      primaryAction: this.primaryAction ?? null,
      hasDetail: typeof this.detailFn === 'function',
      actions: this.actions.map(({ id, label, icon, variant }) => ({ id, label, icon, variant })),
      bulkActions: this.bulkActions.map(({ id, label, icon, variant }) => ({
        id,
        label,
        icon,
        variant,
      })),
      keyField: this.keyField,
    });
  }
}

export function dataTable(data?: unknown, props?: DataTableProps): DataTableElement {
  return new DataTableElement(data, props);
}
