import { describe, expect, test } from 'bun:test';
import {
  applyRowOrder,
  createTableViewState,
  filterRows,
  getPaginationWindow,
  orderColumns,
  paginateRows,
  parsePasteCells,
  processTableData,
  sortRows,
} from './table-data';
import type { DataTableColumn } from './DataTable';

type Row = { id: number; name: string; amount: number; status: string };

const columns: DataTableColumn<Row>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'amount', header: 'Amount' },
  { key: 'status', header: 'Status' },
];

const data: Row[] = [
  { id: 1, name: 'Alice', amount: 30, status: 'done' },
  { id: 2, name: 'Bob', amount: 10, status: 'pending' },
  { id: 3, name: 'Carol', amount: 50, status: 'done' },
  { id: 4, name: 'Dave', amount: 20, status: 'pending' },
];

describe('table-data', () => {
  test('filterRows is case-insensitive', () => {
    expect(filterRows(data, 'alice', ['name'])).toHaveLength(1);
    expect(filterRows(data, 'ALICE', ['name'])).toHaveLength(1);
    expect(filterRows(data, '', ['name'])).toHaveLength(4);
  });

  test('sortRows sorts numbers numerically', () => {
    const sorted = sortRows(data, 'amount', 'asc');
    expect(sorted.map((r) => r.amount)).toEqual([10, 20, 30, 50]);
    const desc = sortRows(data, 'amount', 'desc');
    expect(desc.map((r) => r.amount)).toEqual([50, 30, 20, 10]);
  });

  test('sortRows sorts strings with localeCompare', () => {
    const sorted = sortRows(data, 'name', 'asc');
    expect(sorted.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Carol', 'Dave']);
  });

  test('paginateRows clamps page', () => {
    const p1 = paginateRows(data, 1, 2);
    expect(p1.rows).toHaveLength(2);
    expect(p1.totalPages).toBe(2);

    const clamped = paginateRows(data, 99, 2);
    expect(clamped.clampedPage).toBe(2);
    expect(clamped.rows).toHaveLength(2);
  });

  test('applyRowOrder respects custom order', () => {
    const ordered = applyRowOrder(data, [3, 1, 2, 4], 'id');
    expect(ordered.map((r) => r.id)).toEqual([3, 1, 2, 4]);
  });

  test('orderColumns reorders and hides columns', () => {
    const hidden = new Set(['id']);
    const ordered = orderColumns(columns, ['status', 'name', 'amount', 'id'], hidden);
    expect(ordered.map((c) => c.key)).toEqual(['status', 'name', 'amount']);
  });

  test('orderColumns keeps at least one column visible', () => {
    const hidden = new Set(['id', 'name', 'amount', 'status']);
    const ordered = orderColumns(columns, [], hidden);
    expect(ordered).toHaveLength(1);
  });

  test('processTableData filters sorts and paginates', () => {
    const state = createTableViewState({
      sortKey: 'amount',
      sortDirection: 'desc',
      currentPage: 1,
      pageSize: 2,
      searchQuery: '',
    });

    const result = processTableData(data, columns, state, {
      keyField: 'id',
      paginate: true,
    });

    expect(result.rows.map((r) => r.amount)).toEqual([50, 30]);
    expect(result.totalPages).toBe(2);
    expect(result.total).toBe(4);
  });

  test('processTableData clamps page when filter shrinks results', () => {
    const state = createTableViewState({
      currentPage: 3,
      pageSize: 2,
      searchQuery: 'Alice',
    });

    const result = processTableData(data, columns, state, {
      keyField: 'id',
      paginate: true,
    });

    expect(result.clampedPage).toBe(1);
    expect(result.rows).toHaveLength(1);
  });

  test('processTableData groups rows', () => {
    const state = createTableViewState({ pageSize: 10 });
    const result = processTableData(data, columns, state, {
      keyField: 'id',
      groupBy: 'status',
      paginate: false,
    });

    const groupHeaders = result.entries.filter((e) => e.type === 'group');
    expect(groupHeaders.length).toBe(2);
  });

  test('getPaginationWindow returns windowed pages', () => {
    expect(getPaginationWindow(1, 3)).toEqual([1, 2, 3]);
    const window = getPaginationWindow(5, 10);
    expect(window.length).toBeLessThanOrEqual(7);
    expect(window).toContain(5);
  });

  test('parsePasteCells parses TSV', () => {
    expect(parsePasteCells('a\tb\nc\td')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});
