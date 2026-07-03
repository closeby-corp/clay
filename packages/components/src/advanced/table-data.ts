export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  editable?: boolean;
  editor?: string;
  options?: { label: string; value: string }[];
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: any) => string;
}

export interface TableViewState {
  sortKey: string | null;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  searchQuery: string;
  pageSize: number;
  selectedRowIds: Set<string | number>;
  hiddenColumnKeys: Set<string>;
  collapsedGroupKeys: Set<string>;
  columnOrder: string[];
  rowOrder: (string | number)[];
  editingCell: { rowId: string | number; colKey: string } | null;
}

export function createTableViewState(overrides: Partial<TableViewState> = {}): TableViewState {
  return {
    sortKey: null,
    sortDirection: 'asc',
    currentPage: 1,
    searchQuery: '',
    pageSize: 10,
    selectedRowIds: new Set(),
    hiddenColumnKeys: new Set(),
    collapsedGroupKeys: new Set(),
    columnOrder: [],
    rowOrder: [],
    editingCell: null,
    ...overrides,
    selectedRowIds: overrides.selectedRowIds ?? new Set(),
    hiddenColumnKeys: overrides.hiddenColumnKeys ?? new Set(),
    collapsedGroupKeys: overrides.collapsedGroupKeys ?? new Set(),
    columnOrder: overrides.columnOrder ?? [],
    rowOrder: overrides.rowOrder ?? [],
  };
}

export type GroupByFn<T> = keyof T | ((row: T) => string);

export type TableRowEntry<T> =
  | { type: 'group'; groupKey: string; count: number }
  | { type: 'row'; row: T; rowId: string | number };

export function getSearchableKeys(columns: TableColumn[]): string[] {
  return columns.map((c) => c.key);
}

export function filterRows<T extends Record<string, unknown>>(
  rows: T[],
  query: string,
  keys: string[],
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;

  return rows.filter((row) =>
    keys.some((key) => {
      const val = row[key];
      if (val == null) return false;
      return String(val).toLowerCase().includes(q);
    }),
  );
}

export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export function sortRows<T extends Record<string, unknown>>(
  rows: T[],
  sortKey: string,
  direction: 'asc' | 'desc',
): T[] {
  const sorted = [...rows].sort((a, b) => compareValues(a[sortKey], b[sortKey]));
  return direction === 'desc' ? sorted.reverse() : sorted;
}

export function applyRowOrder<T extends Record<string, unknown>>(
  rows: T[],
  rowOrder: (string | number)[],
  keyField: keyof T,
): T[] {
  if (!rowOrder.length) return rows;

  const byId = new Map<string | number, T>();
  for (const row of rows) {
    byId.set(row[keyField] as string | number, row);
  }

  const ordered: T[] = [];
  const seen = new Set<string | number>();

  for (const id of rowOrder) {
    const row = byId.get(id);
    if (row) {
      ordered.push(row);
      seen.add(id);
    }
  }

  for (const row of rows) {
    const id = row[keyField] as string | number;
    if (!seen.has(id)) ordered.push(row);
  }

  return ordered;
}

export function orderColumns<T>(
  columns: TableColumn[],
  columnOrder: string[],
  hiddenColumnKeys: Set<string>,
): TableColumn[] {
  let ordered = columns;

  if (columnOrder.length) {
    const byKey = new Map(columns.map((c) => [c.key, c]));
    const result: TableColumn[] = [];
    const seen = new Set<string>();

    for (const key of columnOrder) {
      const col = byKey.get(key);
      if (col) {
        result.push(col);
        seen.add(key);
      }
    }

    for (const col of columns) {
      if (!seen.has(col.key)) result.push(col);
    }

    ordered = result;
  }

  if (hiddenColumnKeys.size) {
    const visible = ordered.filter((c) => !hiddenColumnKeys.has(c.key));
    return visible.length > 0 ? visible : ordered.slice(0, 1);
  }

  return ordered;
}

export function resolveGroupKey<T>(row: T, groupBy: GroupByFn<T>): string {
  if (typeof groupBy === 'function') {
    return groupBy(row);
  }
  return String(row[groupBy as keyof T] ?? '');
}

export function groupRows<T extends Record<string, unknown>>(
  rows: T[],
  groupBy: GroupByFn<T>,
  collapsedGroupKeys: Set<string>,
  keyField: keyof T,
): TableRowEntry<T>[] {
  const groups = new Map<string, T[]>();

  for (const row of rows) {
    const key = resolveGroupKey(row, groupBy);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const entries: TableRowEntry<T>[] = [];

  for (const [groupKey, groupRows_] of groups) {
    entries.push({ type: 'group', groupKey, count: groupRows_.length });
    if (!collapsedGroupKeys.has(groupKey)) {
      for (const row of groupRows_) {
        entries.push({ type: 'row', row, rowId: row[keyField] as string | number });
      }
    }
  }

  return entries;
}

export function flattenGroupedRows<T>(
  entries: TableRowEntry<T>[],
  keyField: keyof T,
): TableRowEntry<T>[] {
  return entries.map((entry) => {
    if (entry.type === 'row') {
      return { ...entry, rowId: entry.row[keyField] as string | number };
    }
    return entry;
  });
}

export function paginateEntries<T>(
  entries: TableRowEntry<T>[],
  page: number,
  pageSize: number,
): { entries: TableRowEntry<T>[]; totalPages: number; total: number; clampedPage: number } {
  const total = entries.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * pageSize;
  return {
    entries: entries.slice(start, start + pageSize),
    totalPages,
    total,
    clampedPage,
  };
}

export function paginateRows<T>(
  rows: T[],
  page: number,
  pageSize: number,
): { rows: T[]; totalPages: number; total: number; clampedPage: number } {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    totalPages,
    total,
    clampedPage,
  };
}

export interface ProcessTableOptions<T> {
  groupBy?: GroupByFn<T>;
  keyField: keyof T;
  paginate?: boolean;
  preserveRowOrder?: boolean;
}

export interface ProcessTableResult<T> {
  rows: T[];
  entries: TableRowEntry<T>[];
  visibleColumns: TableColumn[];
  total: number;
  totalPages: number;
  clampedPage: number;
  filteredRows: T[];
}

export function processTableData<T extends Record<string, unknown>>(
  data: T[],
  columns: TableColumn[],
  state: TableViewState,
  options: ProcessTableOptions<T>,
): ProcessTableResult<T> {
  const visibleColumns = orderColumns(columns, state.columnOrder, state.hiddenColumnKeys);
  const searchKeys = getSearchableKeys(visibleColumns);

  let filtered = filterRows(data, state.searchQuery, searchKeys);

  if (state.sortKey) {
    filtered = sortRows(filtered, state.sortKey, state.sortDirection);
  }

  if (state.rowOrder.length) {
    filtered = applyRowOrder(filtered, state.rowOrder, options.keyField);
  }

  const filteredRows = filtered;

  let entries: TableRowEntry<T>[];
  if (options.groupBy) {
    entries = flattenGroupedRows(
      groupRows(filtered, options.groupBy, state.collapsedGroupKeys, options.keyField),
      options.keyField,
    );
  } else {
    entries = filtered.map((row) => ({
      type: 'row' as const,
      row,
      rowId: row[options.keyField] as string | number,
    }));
  }

  let clampedPage = state.currentPage;
  let totalPages = 1;
  let total = entries.length;
  let pagedEntries = entries;
  let rows = filtered;

  if (options.paginate) {
    const paged = paginateEntries(entries, state.currentPage, state.pageSize);
    pagedEntries = paged.entries;
    totalPages = paged.totalPages;
    total = paged.total;
    clampedPage = paged.clampedPage;
    rows = pagedEntries
      .filter((e): e is Extract<TableRowEntry<T>, { type: 'row' }> => e.type === 'row')
      .map((e) => e.row);
  }

  return {
    rows,
    entries: pagedEntries,
    visibleColumns,
    total,
    totalPages,
    clampedPage,
    filteredRows,
  };
}

export function getPageRowIds<T>(
  entries: TableRowEntry<T>[],
  keyField: keyof T,
): (string | number)[] {
  return entries
    .filter((e): e is Extract<TableRowEntry<T>, { type: 'row' }> => e.type === 'row')
    .map((e) => e.row[keyField] as string | number);
}

export function getPaginationWindow(current: number, total: number, maxVisible = 7): number[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function escapeAttr(value: string): string {
  return value.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

export function parsePasteCells(
  raw: string,
): string[][] {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line, i, arr) => line.length > 0 || i < arr.length - 1)
    .map((line) => line.split('\t'));
}
