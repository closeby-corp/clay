import { describe, expect, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { type StackedColumn, StackedRows } from './StackedRows';

type Row = Record<string, unknown>;

const columns: StackedColumn[] = [
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status' },
  { key: 'amount', header: 'Amount', align: 'right' },
];

const rows: Row[] = [
  { id: 'r1', name: 'Alpha', status: 'Open', amount: 10 },
  { id: 'r2', name: 'Beta', status: 'Closed', amount: 20 },
];

const rowKey = (row: Row) => String(row.id);
const renderCell = (row: Row, col: StackedColumn): ReactNode => String(row[col.key] ?? '');

function render(props: Partial<Parameters<typeof StackedRows>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(StackedRows, { rows, columns, rowKey, renderCell, ...props }),
  );
}

describe('StackedRows', () => {
  test('renders one listitem per row with the first column as title', () => {
    const html = render();
    expect(html.match(/role="listitem"/g)?.length).toBe(2);
    expect(html).toContain('data-row-key="r1"');
    expect(html).toContain('data-row-key="r2"');
    expect(html).toContain('role="list"');
    expect(html).toMatch(/<div class="font-medium truncate min-w-0 flex-1">Alpha<\/div>/);
    expect(html).toMatch(/<div class="font-medium truncate min-w-0 flex-1">Beta<\/div>/);
  });

  test('titleKey overrides the default title column and removes it from the body', () => {
    const html = render({ titleKey: 'status' });
    expect(html).toMatch(/flex-1">Open<\/div>/);
    expect(html).not.toMatch(/<dt[^>]*>Status<\/dt>/);
    expect(html).toMatch(/<dt[^>]*>Name<\/dt>/);
  });

  test('other headers render as dt, values as dd, right alignment applied', () => {
    const html = render();
    expect(html).toMatch(/<dt class="text-muted-foreground truncate">Status<\/dt>/);
    expect(html).toMatch(/<dt class="text-muted-foreground truncate">Amount<\/dt>/);
    expect(html).not.toMatch(/<dt[^>]*>Name<\/dt>/);
    expect(html).toContain('<dd class="min-w-0 truncate text-right tabular-nums">10</dd>');
    expect(html).toContain('<dd class="min-w-0 truncate">Closed</dd>');
  });

  test('clickable cards get tabindex and cursor-pointer', () => {
    const html = render({ onRowActivate: () => {} });
    expect(html.match(/tabindex="0"/g)?.length).toBe(2);
    expect(html).toContain('cursor-pointer');
  });

  test('non-clickable cards have no tabindex and no cursor-pointer', () => {
    const html = render();
    expect(html).not.toContain('tabindex');
    expect(html).not.toContain('cursor-pointer');
  });

  test('rowClassName is applied to the matching card', () => {
    const html = render({ rowClassName: (key) => (key === 'r2' ? 'flash-up' : undefined) });
    expect(html).toMatch(/data-row-key="r2" class="[^"]*flash-up/);
    expect(html).not.toMatch(/data-row-key="r1" class="[^"]*flash-up/);
  });

  test('selected cards get the selected styling', () => {
    const html = render({ selectedKeys: new Set(['r1']) });
    expect(html).toMatch(/data-row-key="r1" class="[^"]*border-primary\/50/);
    expect(html).not.toMatch(/data-row-key="r2" class="[^"]*border-primary\/50/);
  });

  test('select and actions slots render top-right', () => {
    const html = render({
      renderSelect: (key) => `<input-${key}>`,
      renderActions: (_row, key) => `actions-${key}`,
    });
    expect(html).toContain('&lt;input-r1&gt;');
    expect(html).toContain('actions-r2');
  });

  test('empty rows render nothing', () => {
    expect(render({ rows: [] })).toBe('');
  });
});
