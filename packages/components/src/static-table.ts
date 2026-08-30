import { Element } from '@close-by/clay-core';

export type StaticTableColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
};

export type StaticTableProps = {
  columns: StaticTableColumn[];
  rows: Array<Record<string, unknown>>;
  caption?: string;
  striped?: boolean;
  className?: string;
};

/** Read-only HTML table for small datasets (no DataTable overhead). */
export function staticTable(props: StaticTableProps): Element {
  return new Element('staticTable', {
    columns: props.columns,
    rows: props.rows,
    caption: props.caption,
    striped: props.striped ?? false,
    className: props.className,
  });
}
