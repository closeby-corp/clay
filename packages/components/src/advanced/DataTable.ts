import { Component, getCurrentContext } from '@badui/core';
import {
  createTableViewState,
  escapeAttr,
  getPageRowIds,
  getPaginationWindow,
  processTableData,
  type GroupByFn,
  type TableRowEntry,
  type TableViewState,
} from './table-data';

export type ColumnEditor = 'text' | 'number' | 'select';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  editable?: boolean;
  editor?: ColumnEditor;
  options?: { label: string; value: string }[];
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => string;
}

export type SelectAllMode = 'page' | 'filtered';

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  key?: string;
  keyField: keyof T;
  sortable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  paginate?: boolean;
  pageSize?: number;
  selectable?: boolean;
  selectAllMode?: SelectAllMode;
  groupBy?: GroupByFn<T>;
  columnVisibility?: boolean;
  columnReorder?: boolean;
  rowReorder?: boolean;
  editable?: boolean;
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
  preserveRowOrder?: boolean;
  on_sort?: (key: string, direction: 'asc' | 'desc') => void;
  on_page_change?: (page: number) => void;
  on_search?: (query: string) => void;
  on_selection_change?: (ids: (string | number)[]) => void;
  on_cell_edit?: (row: T, key: string, value: string) => void;
  on_row_reorder?: (orderedIds: (string | number)[]) => void;
}

export class DataTable<T extends Record<string, any>> extends Component<DataTableProps<T>> {
  private viewState: TableViewState;
  private _initialized = false;
  private searchSignalKey = '';

  constructor(props: DataTableProps<T>) {
    super({ ...props, key: props.key });
    this.viewState = createTableViewState({
      pageSize: props.pageSize ?? 10,
    });
    if (props.key) {
      this.searchSignalKey = `${props.key}_search`;
    }
  }

  refreshProps(partial: Partial<DataTableProps<T>>): void {
    this.props = { ...this.props, ...partial };
    if (partial.pageSize != null) {
      this.viewState.pageSize = partial.pageSize;
    }
  }

  private _ensureInitialized(): void {
    if (this._initialized) return;
    this._initialized = true;

    if (!this.props.key) return;

    this.registerEvent('sort', (data) => {
      const sortKey = data.signals?.sortKey as string;
      if (!sortKey) return;

      if (this.viewState.sortKey === sortKey) {
        this.viewState.sortDirection = this.viewState.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.viewState.sortKey = sortKey;
        this.viewState.sortDirection = 'asc';
      }

      if (!this.props.preserveRowOrder) {
        this.viewState.rowOrder = [];
      }
      this.viewState.currentPage = 1;
      this.props.on_sort?.(sortKey, this.viewState.sortDirection);
    });

    this.registerEvent('page', (data) => {
      const pageSignal = data.signals?.page as string;
      const processed = this._process();
      let page = this.viewState.currentPage;

      if (pageSignal === 'prev') {
        page = Math.max(1, page - 1);
      } else if (pageSignal === 'next') {
        page = Math.min(processed.totalPages, page + 1);
      } else {
        page = parseInt(pageSignal, 10) || 1;
      }

      this.viewState.currentPage = page;
      this.props.on_page_change?.(page);
    });

    this.registerEvent('search', (data) => {
      this.viewState.searchQuery = data.value ?? '';
      this.viewState.currentPage = 1;
      this.props.on_search?.(this.viewState.searchQuery);
    });

    this.registerEvent('select_row', (data) => {
      const rowId = data.signals?.rowId as string;
      const checked = data.signals?.checked === 'true' || data.signals?.checked === true;
      const id = this._parseRowId(rowId);

      if (checked) {
        this.viewState.selectedRowIds.add(id);
      } else {
        this.viewState.selectedRowIds.delete(id);
      }
      this._notifySelection();
    });

    this.registerEvent('select_all', (data) => {
      const checked = data.signals?.checked === 'true' || data.signals?.checked === true;
      const processed = this._process();
      const mode = this.props.selectAllMode ?? 'filtered';

      if (checked) {
        const ids =
          mode === 'page'
            ? getPageRowIds(processed.entries, this.props.keyField)
            : processed.filteredRows.map((r) => r[this.props.keyField] as string | number);
        for (const id of ids) {
          this.viewState.selectedRowIds.add(id);
        }
      } else if (mode === 'page') {
        const ids = getPageRowIds(processed.entries, this.props.keyField);
        for (const id of ids) {
          this.viewState.selectedRowIds.delete(id);
        }
      } else {
        this.viewState.selectedRowIds.clear();
      }
      this._notifySelection();
    });

    this.registerEvent('toggle_column', (data) => {
      const colKey = data.signals?.colKey as string;
      const visible = data.signals?.visible === 'true' || data.signals?.visible === true;
      if (!colKey) return;

      if (visible) {
        this.viewState.hiddenColumnKeys.delete(colKey);
      } else if (this.props.columns.filter((c) => !this.viewState.hiddenColumnKeys.has(c.key) || c.key === colKey).length > 1) {
        this.viewState.hiddenColumnKeys.add(colKey);
      }
    });

    this.registerEvent('toggle_group', (data) => {
      const groupKey = data.signals?.groupKey as string;
      if (!groupKey) return;

      if (this.viewState.collapsedGroupKeys.has(groupKey)) {
        this.viewState.collapsedGroupKeys.delete(groupKey);
      } else {
        this.viewState.collapsedGroupKeys.add(groupKey);
      }
    });

    this.registerEvent('reorder_columns', (data) => {
      const orderRaw = data.signals?.order as string;
      if (!orderRaw) return;
      try {
        this.viewState.columnOrder = JSON.parse(orderRaw);
      } catch {
        /* ignore */
      }
    });

    this.registerEvent('move_column', (data) => {
      const colKey = data.signals?.colKey as string;
      const direction = data.signals?.direction as string;
      if (!colKey || !direction) return;

      const keys = this._visibleColumnKeys();
      const idx = keys.indexOf(colKey);
      if (idx < 0) return;

      const newIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= keys.length) return;

      const next = [...keys];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      this.viewState.columnOrder = next;
    });

    this.registerEvent('reorder_rows', (data) => {
      const orderRaw = data.signals?.order as string;
      if (!orderRaw) return;
      try {
        const order = JSON.parse(orderRaw) as (string | number)[];
        this.viewState.rowOrder = order;
        this.props.on_row_reorder?.(order);
      } catch {
        /* ignore */
      }
    });

    this.registerEvent('begin_edit', (data) => {
      const rowId = this._parseRowId(data.signals?.rowId as string);
      const colKey = data.signals?.colKey as string;
      if (!colKey) return;
      this.viewState.editingCell = { rowId, colKey };
    });

    this.registerEvent('cell_edit', (data) => {
      const rowId = this._parseRowId(data.signals?.rowId as string);
      const colKey = data.signals?.colKey as string;
      const value = data.value ?? data.signals?.value ?? '';
      if (!colKey) return;

      const row = this.props.data.find((r) => r[this.props.keyField] == rowId);
      if (row) {
        this.props.on_cell_edit?.(row, colKey, String(value));
      }
      this.viewState.editingCell = null;
    });

    this.registerEvent('paste', (data) => {
      const cellsRaw = data.signals?.cells as string;
      if (!cellsRaw) return;
      try {
        const cells = JSON.parse(cellsRaw) as { rowId: string | number; colKey: string; value: string }[];
        for (const cell of cells) {
          const row = this.props.data.find((r) => r[this.props.keyField] == cell.rowId);
          if (row) {
            this.props.on_cell_edit?.(row, cell.colKey, cell.value);
          }
        }
      } catch {
        /* ignore */
      }
    });
  }

  private _parseRowId(raw: string): string | number {
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num;
  }

  private _notifySelection(): void {
    this.props.on_selection_change?.(Array.from(this.viewState.selectedRowIds));
  }

  private _visibleColumnKeys(): string[] {
    const processed = this._process();
    return processed.visibleColumns.map((c) => c.key);
  }

  private _process() {
    const result = processTableData(this.props.data, this.props.columns, this.viewState, {
      keyField: this.props.keyField,
      paginate: this.props.paginate,
      groupBy: this.props.groupBy,
      preserveRowOrder: this.props.preserveRowOrder,
    });
    if (result.clampedPage !== this.viewState.currentPage) {
      this.viewState.currentPage = result.clampedPage;
    }
    return result;
  }

  private _isInteractive(): boolean {
    return Boolean(this.props.key);
  }

  private _isColumnSortable(col: DataTableColumn<T>): boolean {
    return col.sortable ?? this.props.sortable ?? false;
  }

  private _isColumnEditable(col: DataTableColumn<T>): boolean {
    return col.editable ?? this.props.editable ?? false;
  }

  private _needsClientScript(): boolean {
    return Boolean(
      this.props.rowReorder ||
        this.props.columnReorder ||
        this.props.editable ||
        this.props.columns.some((c) => c.editable) ||
        this.props.editable,
    );
  }

  render(): string {
    this._ensureInitialized();
    const processed = this._process();
    const { visibleColumns, entries, total, totalPages } = processed;
    const page = this.viewState.currentPage;

    const tableClass = [
      'table',
      this.props.striped ? 'table-zebra' : '',
      this.props.compact ? 'table-sm' : '',
      'w-full',
    ]
      .filter(Boolean)
      .join(' ');

    const clientAttr = this._needsClientScript() ? ' data-badui-table-enhanced' : '';
    const tableKeyAttr = this.props.key ? ` data-table-key="${escapeAttr(this.props.key)}"` : '';

    const extraCols =
      (this.props.selectable ? 1 : 0) + (this.props.rowReorder ? 1 : 0);

    return `
      <div id="${this.id}" class="overflow-x-auto${this.getExtraClasses()}" data-badui-table data-comp-id="${this.id}"${tableKeyAttr}${clientAttr}${this.getExtraStyles()}>
        ${this._renderToolbar(visibleColumns, total)}
        <table class="${tableClass}">
          <thead>
            <tr>
              ${this.props.rowReorder ? `<th class="w-8"></th>` : ''}
              ${this.props.selectable ? this._renderSelectAllHeader(entries) : ''}
              ${visibleColumns.map((col) => this._renderHeader(col)).join('')}
            </tr>
          </thead>
          <tbody>
            ${entries.map((entry) => this._renderEntry(entry, visibleColumns, extraCols)).join('')}
          </tbody>
        </table>
        ${this.props.paginate && total > 0 ? this._renderFooter(total, totalPages, page, entries) : ''}
      </div>
    `;
  }

  private _renderToolbar(columns: DataTableColumn<T>[], total: number): string {
    const parts: string[] = [];

    if (this.props.searchable) {
      const searchAction = this._isInteractive()
        ? ` data-on:input="${this.getDataStarPostAction('search', this.searchSignalKey)}"`
        : '';
      parts.push(`
        <div class="mb-3">
          <input
            type="search"
            class="input input-bordered input-sm w-full max-w-xs"
            placeholder="${escapeAttr(this.props.searchPlaceholder ?? 'Search…')}"
            value="${escapeAttr(this.viewState.searchQuery)}"
            ${this.searchSignalKey ? `data-bind="${this.searchSignalKey}"` : ''}
            ${searchAction}
          />
        </div>
      `);
    }

    const toolbarRight: string[] = [];

    if (this.props.selectable && this.viewState.selectedRowIds.size > 0) {
      toolbarRight.push(
        `<span class="text-sm opacity-70">${this.viewState.selectedRowIds.size} selected</span>`,
      );
    }

    if (this.props.columnVisibility && this._isInteractive()) {
      toolbarRight.push(this._renderColumnVisibilityMenu(columns));
    }

    if (toolbarRight.length) {
      parts.push(`<div class="flex items-center justify-end gap-3 mb-2">${toolbarRight.join('')}</div>`);
    }

    return parts.join('');
  }

  private _renderColumnVisibilityMenu(columns: DataTableColumn<T>[]): string {
    const items = this.props.columns
      .map((col) => {
        const visible = !this.viewState.hiddenColumnKeys.has(col.key);
        const action = this.getDataStarPostActionWithSignals('toggle_column', {
          colKey: col.key,
          visible: !visible,
        });
        return `
          <li>
            <label class="label cursor-pointer justify-start gap-2 px-4 py-2">
              <input type="checkbox" class="checkbox checkbox-sm" ${visible ? 'checked' : ''} data-on:change="${action}" />
              <span class="label-text">${col.header}</span>
            </label>
          </li>
        `;
      })
      .join('');

    return `
      <div class="dropdown dropdown-end">
        <button type="button" tabindex="0" class="btn btn-sm btn-ghost">Columns</button>
        <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-lg border border-base-300">
          ${items}
        </ul>
      </div>
    `;
  }

  private _renderSelectAllHeader(entries: TableRowEntry<T>[]): string {
    if (!this._isInteractive()) {
      return '<th><input type="checkbox" class="checkbox" /></th>';
    }

    const pageIds = getPageRowIds(entries, this.props.keyField);
    const mode = this.props.selectAllMode ?? 'filtered';
    const processed = this._process();
    const targetIds =
      mode === 'page'
        ? pageIds
        : processed.filteredRows.map((r) => r[this.props.keyField] as string | number);

    const selectedCount = targetIds.filter((id) => this.viewState.selectedRowIds.has(id)).length;
    const allSelected = targetIds.length > 0 && selectedCount === targetIds.length;
    const indeterminate = selectedCount > 0 && !allSelected;

    const action = this.getDataStarPostActionWithSignals('select_all', {
      checked: !allSelected,
    });

    return `
      <th class="w-10">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          ${allSelected ? 'checked' : ''}
          ${indeterminate ? 'data-indeterminate="true"' : ''}
          data-on:change="${action}"
        />
      </th>
    `;
  }

  private _renderHeader(col: DataTableColumn<T>): string {
    const sortable = this._isColumnSortable(col);
    const align = col.align ? `text-${col.align}` : '';
    const isSorted = this.viewState.sortKey === col.key;
    const sortIndicator = isSorted ? `<span class="ml-1">${this.viewState.sortDirection === 'asc' ? '↑' : '↓'}</span>` : '';

    const draggableAttr =
      this.props.columnReorder && this._isInteractive()
        ? ` draggable="true" data-col-key="${col.key}" data-draggable-col`
        : '';

    let clickAttr = '';
    if (sortable && this._isInteractive()) {
      clickAttr = ` data-on:click="${this.getDataStarPostActionWithSignals('sort', { sortKey: col.key })}"`;
    }

    const reorderFallback =
      this.props.columnReorder && this._isInteractive()
        ? `<div class="dropdown dropdown-end inline-block ml-1">
            <button type="button" tabindex="0" class="btn btn-ghost btn-xs">⋮</button>
            <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-10 w-32 p-1 shadow border border-base-300">
              <li><button type="button" data-on:click="${this.getDataStarPostActionWithSignals('move_column', { colKey: col.key, direction: 'left' })}">← Move left</button></li>
              <li><button type="button" data-on:click="${this.getDataStarPostActionWithSignals('move_column', { colKey: col.key, direction: 'right' })}">Move right →</button></li>
            </ul>
          </div>`
        : '';

    return `
      <th class="${align} ${sortable ? 'cursor-pointer select-none' : ''}"${draggableAttr}${clickAttr}>
        ${col.header}${sortIndicator}${reorderFallback}
      </th>
    `;
  }

  private _renderEntry(
    entry: TableRowEntry<T>,
    columns: DataTableColumn<T>[],
    extraCols: number,
  ): string {
    if (entry.type === 'group') {
      const collapsed = this.viewState.collapsedGroupKeys.has(entry.groupKey);
      const icon = collapsed ? '▸' : '▾';
      const action = this._isInteractive()
        ? ` data-on:click="${this.getDataStarPostActionWithSignals('toggle_group', { groupKey: entry.groupKey })}"`
        : '';
      const colspan = columns.length + extraCols;

      return `
        <tr class="bg-base-200 font-semibold cursor-pointer" data-group-key="${escapeAttr(entry.groupKey)}"${action}>
          <td colspan="${colspan}">
            ${icon} ${escapeAttr(entry.groupKey)} (${entry.count})
          </td>
        </tr>
      `;
    }

    return this._renderDataRow(entry.row, columns);
  }

  private _renderDataRow(row: T, columns: DataTableColumn<T>[]): string {
    const rowId = row[this.props.keyField] as string | number;
    const selected = this.viewState.selectedRowIds.has(rowId);
    const dragAttr =
      this.props.rowReorder && this._isInteractive()
        ? ` data-row-id="${rowId}" data-draggable-row`
        : ` data-row-id="${rowId}"`;

    return `
      <tr class="${this.props.hover ? 'hover:bg-base-300' : ''}"${dragAttr}>
        ${this.props.rowReorder ? `<td class="cursor-grab text-center opacity-50" data-drag-handle>⠿</td>` : ''}
        ${this.props.selectable ? this._renderRowCheckbox(rowId, selected) : ''}
        ${columns.map((col) => this._renderCell(row, col, rowId)).join('')}
      </tr>
    `;
  }

  private _renderRowCheckbox(rowId: string | number, selected: boolean): string {
    if (!this._isInteractive()) {
      return `<td><input type="checkbox" class="checkbox checkbox-sm" ${selected ? 'checked' : ''} /></td>`;
    }

    const action = this.getDataStarPostActionWithSignals('select_row', {
      rowId: String(rowId),
      checked: !selected,
    });

    return `
      <td class="w-10">
        <input type="checkbox" class="checkbox checkbox-sm" ${selected ? 'checked' : ''} data-on:change="${action}" />
      </td>
    `;
  }

  private _renderCell(row: T, col: DataTableColumn<T>, rowId: string | number): string {
    const align = col.align ? `text-${col.align}` : '';
    const editable = this._isColumnEditable(col);
    const rawValue = row[col.key];
    const isEditing =
      this.viewState.editingCell?.rowId == rowId && this.viewState.editingCell?.colKey === col.key;

    if (editable && isEditing && this._isInteractive()) {
      return this._renderEditableCell(row, col, rowId, rawValue);
    }

    const display = col.render ? col.render(row) : rawValue ?? '';
    const editableAttrs =
      editable && this._isInteractive()
        ? ` data-editable="true" data-col-key="${col.key}" data-row-id="${rowId}" data-raw-value="${escapeAttr(String(rawValue ?? ''))}" tabindex="0" class="cursor-cell ${align}"`
        : ` class="${align}"`;

    return `<td${editableAttrs}>${display}</td>`;
  }

  private _renderEditableCell(
    row: T,
    col: DataTableColumn<T>,
    rowId: string | number,
    rawValue: unknown,
  ): string {
    const editor = col.editor ?? (typeof rawValue === 'number' ? 'number' : 'text');
    const commitAction = this.getDataStarPostActionWithSignals(
      'cell_edit',
      { rowId: String(rowId), colKey: col.key },
      `${this.props.key}_${rowId}_${col.key}`,
    );

    if (editor === 'select' && col.options?.length) {
      const options = col.options
        .map(
          (o) =>
            `<option value="${escapeAttr(o.value)}" ${o.value === String(rawValue) ? 'selected' : ''}>${o.label}</option>`,
        )
        .join('');
      return `
        <td>
          <select class="select select-bordered select-xs w-full" data-bind="${this.props.key}_${rowId}_${col.key}" data-on:change="${commitAction}">
            ${options}
          </select>
        </td>
      `;
    }

    const inputType = editor === 'number' ? 'number' : 'text';
    return `
      <td>
        <input
          type="${inputType}"
          class="input input-bordered input-xs w-full"
          value="${escapeAttr(String(rawValue ?? ''))}"
          data-bind="${this.props.key}_${rowId}_${col.key}"
          data-on:change="${commitAction}"
          data-editing="true"
          autofocus
        />
      </td>
    `;
  }

  private _renderFooter(
    total: number,
    totalPages: number,
    page: number,
    entries: TableRowEntry<T>[],
  ): string {
    const rowCount = entries.filter((e) => e.type === 'row').length;
    const start = total === 0 ? 0 : (page - 1) * this.viewState.pageSize + 1;
    const end = total === 0 ? 0 : start + rowCount - 1;

    const showing = `<div class="text-sm opacity-70 mt-2">Showing ${start}–${end} of ${total}</div>`;

    if (totalPages <= 1) return showing;

    const pages = getPaginationWindow(page, totalPages);
    const prevAction =
      page > 1 && this._isInteractive()
        ? ` data-on:click="${this.getDataStarPostActionWithSignals('page', { page: 'prev' })}"`
        : '';
    const nextAction =
      page < totalPages && this._isInteractive()
        ? ` data-on:click="${this.getDataStarPostActionWithSignals('page', { page: 'next' })}"`
        : '';

    const pageButtons = pages
      .map((p) => {
        const active = p === page ? 'btn-active' : '';
        const action = this._isInteractive()
          ? ` data-on:click="${this.getDataStarPostActionWithSignals('page', { page: p })}"`
          : '';
        return `<button type="button" class="join-item btn btn-sm ${active}"${action}>${p}</button>`;
      })
      .join('');

    return `
      ${showing}
      <div class="flex justify-center mt-2">
        <div class="join">
          <button type="button" class="join-item btn btn-sm ${page === 1 ? 'btn-disabled' : ''}"${prevAction}>«</button>
          ${pageButtons}
          <button type="button" class="join-item btn btn-sm ${page === totalPages ? 'btn-disabled' : ''}"${nextAction}>»</button>
        </div>
      </div>
    `;
  }
}

export function dataTable<T extends Record<string, any>>(
  data: T[],
  props: Omit<DataTableProps<T>, 'data'>,
): DataTable<T> {
  const ctx = getCurrentContext();

  if (ctx && props.key) {
    const comp = ctx.getOrCreateValueComponent(props.key, () => new DataTable({ data, ...props }));
    (comp as DataTable<T>).refreshProps({ data, ...props });
    return comp as DataTable<T>;
  }

  return new DataTable({ data, ...props });
}
