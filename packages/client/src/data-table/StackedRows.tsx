import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StackedColumn = { key: string; header: string; align?: 'left' | 'right' | 'center' };

export type StackedRowsProps = {
  rows: Record<string, unknown>[];
  /** Visible columns, in order. */
  columns: StackedColumn[];
  rowKey: (row: Record<string, unknown>, index: number) => string;
  /** The table's own cell renderer. */
  renderCell: (row: Record<string, unknown>, col: StackedColumn, rowKey: string) => ReactNode;
  /** Column shown as the card title. Defaults to the first column. */
  titleKey?: string;
  /** Row click / Enter. Omit when rows aren't clickable. */
  onRowActivate?: (rowKey: string, e: { target: EventTarget }) => void;
  rowClassName?: (rowKey: string) => string | undefined;
  selectedKeys?: Set<string>;
  /** Optional checkbox slot, top-right. */
  renderSelect?: (rowKey: string) => ReactNode;
  /** Optional actions slot, top-right. */
  renderActions?: (row: Record<string, unknown>, rowKey: string) => ReactNode;
};

export function StackedRows({
  rows,
  columns,
  rowKey,
  renderCell,
  titleKey,
  onRowActivate,
  rowClassName,
  selectedKeys,
  renderSelect,
  renderActions,
}: StackedRowsProps): ReactElement | null {
  if (rows.length === 0 || columns.length === 0) return null;

  const titleCol = columns.find((c) => c.key === titleKey) ?? columns[0];
  const bodyCols = columns.filter((c) => c !== titleCol);

  return (
    <div role="list" className="flex flex-col gap-2 p-2">
      {rows.map((row, index) => {
        const key = rowKey(row, index);
        const selected = selectedKeys?.has(key) ?? false;
        const activatable = onRowActivate !== undefined;

        const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' && e.target === e.currentTarget) {
            onRowActivate?.(key, e);
          }
        };

        return (
          <div
            key={key}
            role="listitem"
            data-row-key={key}
            tabIndex={activatable ? 0 : undefined}
            onClick={activatable ? (e) => onRowActivate(key, e) : undefined}
            onKeyDown={activatable ? handleKeyDown : undefined}
            className={cn(
              'rounded-lg border bg-card p-3 text-sm shadow-xs',
              activatable && 'cursor-pointer transition-colors hover:bg-accent/40',
              selected && 'border-primary/50 bg-primary/5',
              rowClassName?.(key),
            )}
          >
            <div className="flex items-center gap-2">
              <div className="font-medium truncate min-w-0 flex-1">
                {renderCell(row, titleCol, key)}
              </div>
              {renderSelect && <div className="shrink-0">{renderSelect(key)}</div>}
              {renderActions && <div className="shrink-0">{renderActions(row, key)}</div>}
            </div>
            <dl className="mt-2 grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-3 gap-y-1">
              {bodyCols.map((col) => (
                <div key={col.key} className="contents">
                  <dt className="text-muted-foreground truncate">{col.header}</dt>
                  <dd
                    className={cn(
                      'min-w-0 truncate',
                      col.align === 'right' && 'text-right tabular-nums',
                      col.align === 'center' && 'text-center',
                    )}
                  >
                    {renderCell(row, col, key)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </div>
  );
}
