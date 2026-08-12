import { Element } from '@clay/core';
import type { AiDiffColumn, AiDiffRow } from './types';

export type AiDiffTableProps = {
  title?: string;
  columns: AiDiffColumn[];
  rows: AiDiffRow[];
  className?: string;
  onRowClick?: (rowId: string) => void | Promise<void>;
};

/** Compact proposed-edit table (not a full DataTable). */
export function diffTable(props: AiDiffTableProps): Element {
  return new Element('aiDiffTable', {
    title: props.title,
    columns: props.columns,
    rows: props.rows,
    className: props.className,
    onRowClick: props.onRowClick,
  });
}
