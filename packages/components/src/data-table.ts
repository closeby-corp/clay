import { Element, withDetached, withParent } from '@badui/core';
import type { ElementNode } from '@badui/core';

export type TableColumnEditor = 'text' | 'select';

export type TableColumn = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  /** Defaults to true when omitted. */
  sortable?: boolean;
  /** Derived scalar for sort / filter / export / default display. */
  value?: (row: Record<string, unknown>) => unknown;
  /** Optional cell UI; may return an Element (e.g. ui.badge) or a scalar. */
  render?: (row: Record<string, unknown>) => unknown;
  /** Inline editor chrome on the client. */
  editor?: TableColumnEditor;
  /** Options when `editor` is `'select'`. */
  editorOptions?: { value: string; label: string }[];
  /** Render this cell as a link that opens the row detail drawer. */
  detailTrigger?: boolean;
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
  actions?: DataTableAction[];
  onAction?: (actionId: string, row: Record<string, unknown>) => void | Promise<void>;
  /** Show per-column filter row. Default `true`. */
  columnFilterable?: boolean;
  /** Show Columns visibility menu. Default `true`. */
  columnToggle?: boolean;
  /** Show Export menu. Default `true`. */
  exportable?: boolean;
  /** Base filename without extension. Default `'data'`. */
  exportFilename?: string;
  selectable?: boolean;
  reorderable?: boolean;
  views?: DataTableView[];
  defaultView?: string;
  /**
   * Group rows by a column key or a derived value.
   * After filter/sort, rows are partitioned so each group is contiguous.
   */
  groupBy?: string | ((row: Record<string, unknown>) => unknown);
  /** When true, the client starts with every group collapsed. Default `false`. */
  defaultCollapsed?: boolean;
  primaryAction?: DataTablePrimaryAction;
  /** Build detached Element tree stamped as `__detail` for the drawer. */
  detail?: (row: Record<string, unknown>) => void;
  onReorder?: (orderedKeys: Array<string | number>) => void | Promise<void>;
  onSelectionChange?: (keys: Array<string | number>) => void | Promise<void>;
  onPageSizeChange?: (pageSize: number) => void | Promise<void>;
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

type SortDir = 'asc' | 'desc';

type SortPayload = { key?: string; dir?: SortDir };
type ActionPayload = { actionId?: string; rowKey?: string | number };
type ColumnFilterPayload = { key?: string; value?: string };
type ColumnVisibilityPayload = { key?: string; visible?: boolean };
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
  editor?: TableColumnEditor;
  editorOptions?: { value: string; label: string }[];
  detailTrigger?: boolean;
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

function toClientColumns(columns: TableColumn[]): ClientColumn[] {
  return columns.map(({ key, header, align, sortable, editor, editorOptions, detailTrigger }) => ({
    key,
    header,
    align,
    sortable,
    editor,
    editorOptions,
    detailTrigger,
  }));
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
    const q = value.trim().toLowerCase();
    if (!q) continue;
    const col = columns.find((c) => c.key === key);
    const cell = col ? cellValue(col, row) : row[key];
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
  private sortKey: string | null = null;
  private sortDir: SortDir = 'asc';
  private filter = '';
  private columnFilters: Record<string, string> = {};
  private hiddenKeys = new Set<string>();
  private page = 1;
  private pageSize: number;
  private pageSizeOptions: number[];
  private searchable: boolean;
  private searchPlaceholder: string;
  private columnFilterable: boolean;
  private columnToggle: boolean;
  private exportable: boolean;
  private exportFilename: string;
  private selectable: boolean;
  private reorderable: boolean;
  private views: DataTableView[];
  private activeView: string;
  private groupBy?: string | ((row: Record<string, unknown>) => unknown);
  private defaultCollapsed: boolean;
  private primaryAction?: DataTablePrimaryAction;
  private detailFn?: (row: Record<string, unknown>) => void;
  private actions: DataTableAction[];
  private onActionFn?: (actionId: string, row: Record<string, unknown>) => void | Promise<void>;
  private onReorderFn?: (orderedKeys: Array<string | number>) => void | Promise<void>;
  private onSelectionChangeFn?: (keys: Array<string | number>) => void | Promise<void>;
  private onPageSizeChangeFn?: (pageSize: number) => void | Promise<void>;
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
    const actions = props.actions ?? [];
    const keyField = props.keyField ?? ROW_ID_FIELD;
    const searchPlaceholder = props.searchPlaceholder ?? 'Search…';
    const columnFilterable = props.columnFilterable !== false;
    const columnToggle = props.columnToggle !== false;
    const exportable = props.exportable !== false;
    const exportFilename = props.exportFilename ?? 'data';
    const selectable = props.selectable === true;
    const reorderable = props.reorderable === true;
    const views = props.views ?? [];
    const activeView = props.defaultView ?? views[0]?.id ?? '';
    const groupBy = props.groupBy;
    const defaultCollapsed = props.defaultCollapsed === true;
    const primaryAction = props.primaryAction;

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
      filter: '',
      columnFilters: {},
      hiddenColumns: [],
      sortKey: null,
      sortDir: 'asc',
      page: 1,
      pageSize,
      totalRows: 0,
      totalPages: 1,
    });

    this.sourceRows = rows;
    this.columns = columns;
    this.columnsExplicit = columnsExplicit;
    this.keyField = keyField;
    this.pageSize = pageSize;
    this.pageSizeOptions = pageSizeOptions;
    this.searchable = searchable;
    this.searchPlaceholder = searchPlaceholder;
    this.columnFilterable = columnFilterable;
    this.columnToggle = columnToggle;
    this.exportable = exportable;
    this.exportFilename = exportFilename;
    this.selectable = selectable;
    this.reorderable = reorderable;
    this.views = views;
    this.activeView = activeView;
    this.groupBy = groupBy;
    this.defaultCollapsed = defaultCollapsed;
    this.primaryAction = primaryAction;
    this.detailFn = props.detail;
    this.actions = actions;
    this.onActionFn = props.onAction;
    this.onReorderFn = props.onReorder;
    this.onSelectionChangeFn = props.onSelectionChange;
    this.onPageSizeChangeFn = props.onPageSizeChange;
    this.onCellChangeFn = props.onCellChange;
    this.onViewChangeFn = props.onViewChange;
    this.onGroupToggleFn = props.onGroupToggle;
    this.onPrimaryActionFn = props.onPrimaryAction;

    this.on('sort', (value) => this.handleSort(value));
    this.on('filter', (value) => this.handleFilter(value));
    this.on('columnFilter', (value) => this.handleColumnFilter(value));
    this.on('columnVisibility', (value) => this.handleColumnVisibility(value));
    this.on('export', (value) => this.handleExport(value));
    this.on('page', (value) => this.handlePage(value));
    this.on('action', (value) => this.handleAction(value));
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
    }
    this.page = 1;
    this.syncView();
    return this;
  }

  visibleColumns(): TableColumn[] {
    return this.columns.filter((col) => !this.hiddenKeys.has(col.key));
  }

  private handleSort(value: unknown): void {
    const payload = (value ?? {}) as SortPayload;
    const key = payload.key;
    if (!key) return;
    const col = this.columns.find((c) => c.key === key);
    if (!col || col.sortable === false) return;

    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = payload.dir === 'desc' ? 'desc' : 'asc';
    }
    this.page = 1;
    this.syncView();
  }

  private handleFilter(value: unknown): void {
    this.filter = String(value ?? '');
    this.page = 1;
    this.syncView();
  }

  private handleColumnFilter(value: unknown): void {
    const payload = (value ?? {}) as ColumnFilterPayload;
    const key = payload.key;
    if (!key || !this.columns.some((c) => c.key === key)) return;
    const next = String(payload.value ?? '');
    if (next.trim() === '') {
      delete this.columnFilters[key];
    } else {
      this.columnFilters[key] = next;
    }
    this.page = 1;
    this.syncView();
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

  private handlePage(value: unknown): void {
    const next = Number(value);
    if (!Number.isFinite(next) || next < 1) return;
    this.page = Math.floor(next);
    this.syncView();
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

  private async handleReorder(value: unknown): Promise<void> {
    const payload = (value ?? {}) as ReorderPayload;
    const orderedKeys = payload.orderedKeys;
    if (!Array.isArray(orderedKeys) || orderedKeys.length === 0) return;

    const byKey = new Map(this.sourceRows.map((r) => [String(r[this.keyField]), r]));
    const next: Record<string, unknown>[] = [];
    for (const key of orderedKeys) {
      const row = byKey.get(String(key));
      if (row) {
        next.push(row);
        byKey.delete(String(key));
      }
    }
    for (const row of byKey.values()) next.push(row);
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

  private async handleCellChange(value: unknown): Promise<void> {
    const payload = (value ?? {}) as CellChangePayload;
    if (payload.rowKey == null || !payload.columnKey) return;
    const row = this.sourceRows.find((r) => String(r[this.keyField]) === String(payload.rowKey));
    if (!row) return;
    row[payload.columnKey] = payload.value;
    this.syncView();
    if (this.onCellChangeFn) {
      await this.onCellChangeFn(payload.rowKey, payload.columnKey, payload.value);
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

  /** Visible rows after view filter + search/column filters + sort (+ group contiguous). */
  computeProcessedRows(): Record<string, unknown>[] {
    const active = this.views.find((v) => v.id === this.activeView);
    let rows = active?.filter
      ? this.sourceRows.filter((row) => active.filter!(row))
      : this.sourceRows;
    rows = rows.filter(
      (row) =>
        rowMatchesGlobalFilter(row, this.columns, this.filter) &&
        rowMatchesColumnFilters(row, this.columns, this.columnFilters),
    );
    if (this.sortKey) {
      const key = this.sortKey;
      const dir = this.sortDir;
      const col = this.columns.find((c) => c.key === key);
      rows = [...rows].sort((a, b) => {
        const av = col ? cellValue(col, a) : a[key];
        const bv = col ? cellValue(col, b) : b[key];
        const cmp = compareValues(av, bv);
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    if (this.groupBy) {
      rows = groupRows(rows, this.groupBy, this.columns).rows;
    }
    return rows;
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
    const totalRows = processed.length;
    const totalPages =
      this.pageSize > 0 ? Math.max(1, Math.ceil(totalRows / this.pageSize) || 1) : 1;
    if (this.page > totalPages) this.page = totalPages;
    if (this.page < 1) this.page = 1;

    const start = this.pageSize > 0 ? (this.page - 1) * this.pageSize : 0;
    const pageRows =
      this.pageSize > 0 ? processed.slice(start, start + this.pageSize) : processed;
    const visibleCols = this.visibleColumns();
    const groups = this.groupBy
      ? groupRows(processed, this.groupBy, this.columns).groups
      : [];
    const visible = pageRows.map((row) => {
      const display = buildDisplayRow(row, visibleCols, this.detailFn);
      if (this.groupBy) {
        display[GROUP_KEY_FIELD] = resolveGroupValue(row, this.groupBy, this.columns).key;
      }
      return display;
    });

    this.update({
      columns: toClientColumns(visibleCols),
      allColumns: toClientColumns(this.columns),
      rows: visible,
      filter: this.filter,
      columnFilters: { ...this.columnFilters },
      hiddenColumns: [...this.hiddenKeys],
      sortKey: this.sortKey,
      sortDir: this.sortDir,
      page: this.page,
      pageSize: this.pageSize,
      pageSizeOptions: this.pageSizeOptions,
      totalRows,
      totalPages,
      searchable: this.searchable,
      searchPlaceholder: this.searchPlaceholder,
      columnFilterable: this.columnFilterable,
      columnToggle: this.columnToggle,
      exportable: this.exportable,
      selectable: this.selectable,
      reorderable: this.reorderable,
      views: this.clientViews(),
      activeView: this.activeView,
      groupBy: typeof this.groupBy === 'string' ? this.groupBy : this.groupBy ? true : null,
      groups,
      defaultCollapsed: this.defaultCollapsed,
      primaryAction: this.primaryAction ?? null,
      hasDetail: typeof this.detailFn === 'function',
      actions: this.actions.map(({ id, label, icon, variant }) => ({ id, label, icon, variant })),
      keyField: this.keyField,
    });
  }
}

export function dataTable(data?: unknown, props?: DataTableProps): DataTableElement {
  return new DataTableElement(data, props);
}
