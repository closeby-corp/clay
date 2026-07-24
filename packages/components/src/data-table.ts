import { Element } from '@badui/core';

export type TableColumn = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  /** Defaults to true when omitted. */
  sortable?: boolean;
};

export type DataTableAction = {
  id: string;
  label: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
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
};

/** Reserved row identity when `keyField` is omitted. Never inferred as a visible column. */
export const ROW_ID_FIELD = '__rowId';

type SortDir = 'asc' | 'desc';

type SortPayload = { key?: string; dir?: SortDir };
type ActionPayload = { actionId?: string; rowKey?: string | number };
type ColumnFilterPayload = { key?: string; value?: string };
type ColumnVisibilityPayload = { key?: string; visible?: boolean };
type ExportPayload = { format?: ExportFormat; mode?: ExportMode };

type NormalizedTable = {
  rows: Record<string, unknown>[];
  inferredColumns: TableColumn[];
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
    .filter((key) => key !== ROW_ID_FIELD)
    .map((key) => ({ key, header: key, sortable: true }));
}

function withSortableDefaults(columns: TableColumn[]): TableColumn[] {
  return columns.map((col) => ({
    ...col,
    sortable: col.sortable !== false,
  }));
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
  return columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(q));
}

function rowMatchesColumnFilters(
  row: Record<string, unknown>,
  columnFilters: Record<string, string>,
): boolean {
  for (const [key, value] of Object.entries(columnFilters)) {
    const q = value.trim().toLowerCase();
    if (!q) continue;
    if (!String(row[key] ?? '').toLowerCase().includes(q)) return false;
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
  private searchable: boolean;
  private searchPlaceholder: string;
  private columnFilterable: boolean;
  private columnToggle: boolean;
  private exportable: boolean;
  private exportFilename: string;
  private actions: DataTableAction[];
  private onActionFn?: (actionId: string, row: Record<string, unknown>) => void | Promise<void>;

  constructor(data: unknown = [], props: DataTableProps = {}) {
    const columnsExplicit = props.columns !== undefined;
    const { rows, inferredColumns } = normalizeTableData(data);
    const columns = withSortableDefaults(columnsExplicit ? props.columns! : inferredColumns);
    const searchable = props.searchable !== false;
    const pageSize = props.pageSize ?? 10;
    const actions = props.actions ?? [];
    const keyField = props.keyField ?? ROW_ID_FIELD;
    const searchPlaceholder = props.searchPlaceholder ?? 'Search…';
    const columnFilterable = props.columnFilterable !== false;
    const columnToggle = props.columnToggle !== false;
    const exportable = props.exportable !== false;
    const exportFilename = props.exportFilename ?? 'data';

    super('datatable', {
      columns,
      allColumns: columns,
      rows: [],
      className: props.className,
      keyField,
      searchable,
      searchPlaceholder,
      columnFilterable,
      columnToggle,
      exportable,
      actions: actions.map(({ id, label, variant }) => ({ id, label, variant })),
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
    this.searchable = searchable;
    this.searchPlaceholder = searchPlaceholder;
    this.columnFilterable = columnFilterable;
    this.columnToggle = columnToggle;
    this.exportable = exportable;
    this.exportFilename = exportFilename;
    this.actions = actions;
    this.onActionFn = props.onAction;

    this.on('sort', (value) => this.handleSort(value));
    this.on('filter', (value) => this.handleFilter(value));
    this.on('columnFilter', (value) => this.handleColumnFilter(value));
    this.on('columnVisibility', (value) => this.handleColumnVisibility(value));
    this.on('export', (value) => this.handleExport(value));
    this.on('page', (value) => this.handlePage(value));
    this.on('action', (value) => this.handleAction(value));

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
      // Drop filters/hidden keys that no longer exist
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
        return; // keep at least one column
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
    const rows = this.computeProcessedRows();
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

  /** Visible rows after filter + sort (before pagination). */
  computeProcessedRows(): Record<string, unknown>[] {
    let rows = this.sourceRows.filter(
      (row) =>
        rowMatchesGlobalFilter(row, this.columns, this.filter) &&
        rowMatchesColumnFilters(row, this.columnFilters),
    );
    if (this.sortKey) {
      const key = this.sortKey;
      const dir = this.sortDir;
      rows = [...rows].sort((a, b) => {
        const cmp = compareValues(a[key], b[key]);
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }

  syncView(): void {
    const processed = this.computeProcessedRows();
    const totalRows = processed.length;
    const totalPages =
      this.pageSize > 0 ? Math.max(1, Math.ceil(totalRows / this.pageSize) || 1) : 1;
    if (this.page > totalPages) this.page = totalPages;
    if (this.page < 1) this.page = 1;

    const start = this.pageSize > 0 ? (this.page - 1) * this.pageSize : 0;
    const visible =
      this.pageSize > 0 ? processed.slice(start, start + this.pageSize) : processed;
    const visibleCols = this.visibleColumns();

    this.update({
      columns: visibleCols,
      allColumns: this.columns,
      rows: visible,
      filter: this.filter,
      columnFilters: { ...this.columnFilters },
      hiddenColumns: [...this.hiddenKeys],
      sortKey: this.sortKey,
      sortDir: this.sortDir,
      page: this.page,
      pageSize: this.pageSize,
      totalRows,
      totalPages,
      searchable: this.searchable,
      searchPlaceholder: this.searchPlaceholder,
      columnFilterable: this.columnFilterable,
      columnToggle: this.columnToggle,
      exportable: this.exportable,
      actions: this.actions.map(({ id, label, variant }) => ({ id, label, variant })),
      keyField: this.keyField,
    });
  }
}

export function dataTable(data?: unknown, props?: DataTableProps): DataTableElement {
  return new DataTableElement(data, props);
}
