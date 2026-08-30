import { Element } from '@close-by/clay-core';

export type StaticTableColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  /** Monospace cells (ids, hashes). */
  mono?: boolean;
  className?: string;
};

export type StaticTableDensity = 'default' | 'compact';

export type StaticTableProps = {
  columns: StaticTableColumn[];
  rows: Array<Record<string, unknown>>;
  caption?: string;
  striped?: boolean;
  /** Outer rounded border. Default `true`. */
  bordered?: boolean;
  /** Row hover highlight. Default `true`. */
  hoverable?: boolean;
  /** Cell padding density. Default `default`. */
  density?: StaticTableDensity;
  /** Shown when `rows` is empty. */
  emptyTitle?: string;
  className?: string;
};

/** Read-only HTML table for small datasets (no DataTable overhead). */
export function staticTable(props: StaticTableProps): Element {
  return new Element('staticTable', {
    columns: props.columns,
    rows: props.rows,
    caption: props.caption,
    striped: props.striped ?? false,
    bordered: props.bordered !== false,
    hoverable: props.hoverable !== false,
    density: props.density === 'compact' ? 'compact' : 'default',
    emptyTitle: props.emptyTitle,
    className: props.className,
  });
}
