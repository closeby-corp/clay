import { dataTable, type DataTableAction, type DataTableElement, type DataTableProps, type DataTableView, type TableColumn } from '../../data-table';

export type PageSizeOptions = {
  options?: number[];
};

export type GroupByOptions = {
  defaultCollapsed?: boolean;
};

/**
 * Staged DataTable builder. Accumulates related props, then `.build()` calls `dataTable(data, props)`.
 */
export class TableBuilder {
  private data: unknown;
  private props: DataTableProps = {};

  constructor(data?: unknown) {
    this.data = data;
  }

  id(keyField: string): this {
    this.props.keyField = keyField;
    return this;
  }

  columns(cols: TableColumn[]): this {
    this.props.columns = cols;
    return this;
  }

  /** Enable search (`searchable: true`) with optional placeholder. */
  search(placeholder?: string): this {
    this.props.searchable = true;
    if (placeholder !== undefined) {
      this.props.searchPlaceholder = placeholder;
    }
    return this;
  }

  pageSize(n: number, options?: PageSizeOptions): this {
    this.props.pageSize = n;
    if (options?.options) {
      this.props.pageSizeOptions = options.options;
    }
    return this;
  }

  groupBy(
    key: string | ((row: Record<string, unknown>) => unknown),
    opts?: GroupByOptions,
  ): this {
    this.props.groupBy = key;
    if (opts?.defaultCollapsed !== undefined) {
      this.props.defaultCollapsed = opts.defaultCollapsed;
    }
    return this;
  }

  views(items: DataTableView[], defaultId?: string): this {
    this.props.views = items;
    if (defaultId !== undefined) {
      if (!items.some((v) => v.id === defaultId)) {
        throw new Error(`table.views: defaultId "${defaultId}" is not in the views list`);
      }
      this.props.defaultView = defaultId;
    }
    return this;
  }

  /** Row actions require both `actions` and `onAction`. */
  rowActions(
    actions: DataTableAction[],
    onAction: (actionId: string, row: Record<string, unknown>) => void | Promise<void>,
  ): this {
    if (actions.length === 0) {
      throw new Error('table.rowActions: actions must be non-empty when a handler is provided');
    }
    this.props.actions = actions;
    this.props.onAction = onAction;
    return this;
  }

  /**
   * Row detail drawer body. Use `detailTrigger: true` on a column to open it from a cell link.
   */
  detail(fn: (row: Record<string, unknown>) => void): this {
    this.props.detail = fn;
    return this;
  }

  selectable(
    onChange?: (keys: Array<string | number>) => void | Promise<void>,
  ): this {
    this.props.selectable = true;
    if (onChange) {
      this.props.onSelectionChange = onChange;
    }
    return this;
  }

  reorderable(
    onReorder?: (orderedKeys: Array<string | number>) => void | Promise<void>,
  ): this {
    this.props.reorderable = true;
    if (onReorder) {
      this.props.onReorder = onReorder;
    }
    return this;
  }

  /** Enable export (`exportable: true`) with optional filename. */
  export(filename?: string): this {
    this.props.exportable = true;
    if (filename !== undefined) {
      this.props.exportFilename = filename;
    }
    return this;
  }

  className(className: string): this {
    this.props.className = className;
    return this;
  }

  /** Compile to `dataTable` and mount via context (same as the legacy factory). */
  build(): DataTableElement {
    return dataTable(this.data, { ...this.props });
  }
}

/** Start a staged table builder: `ui.table(data).columns(...).build()`. */
export function table(data?: unknown): TableBuilder {
  return new TableBuilder(data);
}
