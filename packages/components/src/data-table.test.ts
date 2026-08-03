import { describe, expect, test } from 'bun:test';
import { Element } from '@badui/core';
import {
  DataTableElement,
  ROW_ID_FIELD,
  normalizeTableData,
  rowsToCsv,
  rowsToJson,
  rowsToTsv,
} from './data-table';

const rows = [
  { id: 1, title: 'Alpha', status: 'done', hours: 3 },
  { id: 2, title: 'Bravo', status: 'todo', hours: 10 },
  { id: 3, title: 'Charlie', status: 'done', hours: 1 },
  { id: 4, title: 'Delta', status: 'todo', hours: 7 },
  { id: 5, title: 'Echo', status: 'in progress', hours: 5 },
];

const columns = [
  { key: 'id', header: 'ID' },
  { key: 'title', header: 'Title' },
  { key: 'status', header: 'Status' },
  { key: 'hours', header: 'Hours', align: 'right' as const },
];

describe('normalizeTableData', () => {
  test('infers columns from array of objects and stamps __rowId', () => {
    const { rows: normalized, inferredColumns } = normalizeTableData([
      { name: 'Ada', role: 'Admin' },
      { name: 'Lin', role: 'Editor' },
    ]);
    expect(inferredColumns.map((c) => c.key)).toEqual(['name', 'role']);
    expect(normalized[0]).toEqual({ name: 'Ada', role: 'Admin', [ROW_ID_FIELD]: 0 });
    expect(normalized[1]?.[ROW_ID_FIELD]).toBe(1);
  });

  test('converts key-value objects to Key/Value rows', () => {
    const { rows: normalized, inferredColumns } = normalizeTableData({
      host: 'localhost',
      port: 4000,
      nested: { a: 1 },
    });
    expect(inferredColumns.map((c) => c.key)).toEqual(['key', 'value']);
    expect(normalized.map((r) => ({ key: r.key, value: r.value }))).toEqual([
      { key: 'host', value: 'localhost' },
      { key: 'port', value: 4000 },
      { key: 'nested', value: '{"a":1}' },
    ]);
  });

  test('handles empty array and empty object', () => {
    expect(normalizeTableData([])).toEqual({ rows: [], inferredColumns: [] });
    expect(normalizeTableData({})).toEqual({ rows: [], inferredColumns: [] });
  });

  test('wraps primitive arrays as value rows', () => {
    const { rows: normalized, inferredColumns } = normalizeTableData(['a', 'b']);
    expect(inferredColumns.map((c) => c.key)).toEqual(['value']);
    expect(normalized.map((r) => r.value)).toEqual(['a', 'b']);
  });
});

describe('export serializers', () => {
  const cols = [
    { key: 'title', header: 'Title' },
    { key: 'note', header: 'Note' },
  ];
  const data = [
    { title: 'A', note: 'plain' },
    { title: 'B', note: 'has, comma' },
    { title: 'C', note: 'say "hi"' },
  ];

  test('rowsToCsv quotes special fields', () => {
    expect(rowsToCsv(data, cols)).toBe(
      ['Title,Note', 'A,plain', 'B,"has, comma"', 'C,"say ""hi"""'].join('\n'),
    );
  });

  test('rowsToTsv uses tabs', () => {
    expect(rowsToTsv(data.slice(0, 1), cols)).toBe('Title\tNote\nA\tplain');
  });

  test('rowsToJson projects visible columns', () => {
    expect(JSON.parse(rowsToJson(data.slice(0, 1), cols))).toEqual([{ title: 'A', note: 'plain' }]);
  });
});

describe('DataTableElement', () => {
  test('sorts ascending and descending', async () => {
    const table = new DataTableElement(rows, { columns, pageSize: 10 });
    await table.handleEvent('sort', { key: 'hours', dir: 'asc' });
    expect(table.props.rows.map((r: Record<string, unknown>) => r.hours)).toEqual([1, 3, 5, 7, 10]);

    await table.handleEvent('sort', { key: 'hours', dir: 'desc' });
    expect(table.props.rows.map((r: Record<string, unknown>) => r.hours)).toEqual([10, 7, 5, 3, 1]);
  });

  test('filters by substring across columns', async () => {
    const table = new DataTableElement(rows, { columns, pageSize: 10 });
    await table.handleEvent('filter', 'done');
    expect(table.props.totalRows).toBe(2);
    expect(table.props.rows.map((r: Record<string, unknown>) => r.title)).toEqual(['Alpha', 'Charlie']);
  });

  test('column filters AND with global filter', async () => {
    const table = new DataTableElement(rows, { columns, pageSize: 10 });
    await table.handleEvent('filter', 'a');
    await table.handleEvent('columnFilter', { key: 'status', value: 'done' });
    expect(table.props.rows.map((r: Record<string, unknown>) => r.title)).toEqual(['Alpha', 'Charlie']);
  });

  test('hides columns but keeps allColumns; cannot hide last', async () => {
    const table = new DataTableElement(rows, { columns, pageSize: 10 });
    await table.handleEvent('columnVisibility', { key: 'hours', visible: false });
    expect(table.props.columns.map((c: { key: string }) => c.key)).toEqual([
      'id',
      'title',
      'status',
    ]);
    expect(table.props.allColumns.map((c: { key: string }) => c.key)).toEqual([
      'id',
      'title',
      'status',
      'hours',
    ]);
    expect(table.props.hiddenColumns).toEqual(['hours']);

    await table.handleEvent('columnVisibility', { key: 'id', visible: false });
    await table.handleEvent('columnVisibility', { key: 'title', visible: false });
    await table.handleEvent('columnVisibility', { key: 'status', visible: false });
    expect(table.props.columns.length).toBe(1);
    expect(table.props.hiddenColumns).toHaveLength(3);
  });

  test('hidden columns are excluded from export helpers via visibleColumns', async () => {
    const table = new DataTableElement(rows, { columns, pageSize: 10 });
    await table.handleEvent('columnVisibility', { key: 'status', visible: false });
    const visible = table.visibleColumns();
    const csv = rowsToCsv(table.computeProcessedRows().slice(0, 1), visible);
    expect(csv.startsWith('ID,Title,Hours')).toBe(true);
    expect(csv.includes('Status')).toBe(false);
  });

  test('paginates and clamps page bounds', async () => {
    const table = new DataTableElement(rows, { columns, pageSize: 2 });
    expect(table.props.totalPages).toBe(3);
    expect(table.props.rows.map((r: Record<string, unknown>) => r.id)).toEqual([1, 2]);

    await table.handleEvent('page', 2);
    expect(table.props.page).toBe(2);
    expect(table.props.rows.map((r: Record<string, unknown>) => r.id)).toEqual([3, 4]);

    await table.handleEvent('page', 99);
    expect(table.props.page).toBe(3);
    expect(table.props.rows.map((r: Record<string, unknown>) => r.id)).toEqual([5]);
  });

  test('setRows resets to first page and replaces source', () => {
    const table = new DataTableElement(rows, { columns, pageSize: 2 });
    table.handleEvent('page', 2);
    table.setRows([{ id: 9, title: 'Zulu', status: 'todo', hours: 1 }]);
    expect(table.props.page).toBe(1);
    expect(table.props.totalRows).toBe(1);
    expect(table.getRows()).toEqual([{ id: 9, title: 'Zulu', status: 'todo', hours: 1, [ROW_ID_FIELD]: 0 }]);
  });

  test('setRows accepts a key-value object', () => {
    const table = new DataTableElement(rows, { pageSize: 10 });
    table.setRows({ alpha: 1, beta: 'two' });
    expect(table.props.columns.map((c: { key: string }) => c.key)).toEqual(['key', 'value']);
    expect(table.props.totalRows).toBe(2);
  });

  test('infers columns when omitted', () => {
    const table = new DataTableElement([{ name: 'Ada', role: 'Admin' }]);
    expect(table.props.columns.map((c: { key: string }) => c.key)).toEqual(['name', 'role']);
    expect(table.props.keyField).toBe(ROW_ID_FIELD);
  });

  test('defaults keyField to __rowId and resolves actions by it', async () => {
    const seen: Array<{ actionId: string; title: unknown; rowId: unknown }> = [];
    const table = new DataTableElement(
      [
        { title: 'Alpha' },
        { title: 'Bravo' },
      ],
      {
        pageSize: 10,
        onAction: (actionId, row) => {
          seen.push({ actionId, title: row.title, rowId: row[ROW_ID_FIELD] });
        },
      },
    );
    expect(table.props.keyField).toBe(ROW_ID_FIELD);
    await table.handleEvent('action', { actionId: 'edit', rowKey: 1 });
    expect(seen).toEqual([{ actionId: 'edit', title: 'Bravo', rowId: 1 }]);
  });

  test('explicit keyField still wins', async () => {
    const seen: Array<{ actionId: string; id: unknown }> = [];
    const table = new DataTableElement(rows, {
      columns,
      keyField: 'id',
      pageSize: 10,
      onAction: (actionId, row) => {
        seen.push({ actionId, id: row.id });
      },
    });
    await table.handleEvent('action', { actionId: 'edit', rowKey: 3 });
    expect(seen).toEqual([{ actionId: 'edit', id: 3 }]);
    expect(table.props.keyField).toBe('id');
  });

  test('exposes table interaction events', () => {
    const table = new DataTableElement(rows, { columns });
    expect(table.props.events).toEqual(
      expect.arrayContaining([
        'sort',
        'filter',
        'columnFilter',
        'columnVisibility',
        'export',
        'page',
        'action',
      ]),
    );
  });

  test('value() drives sort and filter', async () => {
    const table = new DataTableElement(rows, {
      pageSize: 10,
      columns: [
        { key: 'title', header: 'Title' },
        {
          key: 'billable',
          header: 'Billable',
          value: (row) => Number(row.hours) * 10,
        },
      ],
    });
    await table.handleEvent('sort', { key: 'billable', dir: 'asc' });
    expect(table.props.rows.map((r: Record<string, unknown>) => r.title)).toEqual([
      'Charlie',
      'Alpha',
      'Echo',
      'Delta',
      'Bravo',
    ]);

    await table.handleEvent('filter', '50'); // 5*10
    expect(table.props.rows.map((r: Record<string, unknown>) => r.title)).toEqual(['Echo']);
  });

  test('render() puts badge ElementNode in __cells', () => {
    const table = new DataTableElement(rows, {
      pageSize: 10,
      columns: [
        { key: 'title', header: 'Title' },
        {
          key: 'status',
          header: 'Status',
          value: (row) => row.status,
          render: (row) => new Element('badge', { text: String(row.status), variant: 'outline' }),
        },
      ],
    });
    const first = table.props.rows[0] as Record<string, unknown>;
    const cells = first.__cells as Record<string, unknown>;
    const statusCell = cells.status as { __ui: { type: string; props: Record<string, unknown> } };
    expect(statusCell.__ui.type).toBe('badge');
    expect(statusCell.__ui.props.text).toBe('done');
  });

  test('export uses computed value not render UI', async () => {
    const messages: Array<{ op: string; content?: string }> = [];
    const table = new DataTableElement(rows, {
      pageSize: 10,
      columns: [
        { key: 'title', header: 'Title' },
        {
          key: 'billable',
          header: 'Billable',
          value: (row) => Number(row.hours) * 10,
          render: (row) => new Element('badge', { text: `$${Number(row.hours) * 10}` }),
        },
      ],
    });
    // Attach a fake session for export
    const { ClientSession } = await import('@badui/core');
    const session = new ClientSession('/t', (m) => messages.push(m as { op: string; content?: string }));
    table.setSession(session);
    await table.handleEvent('export', { format: 'csv', mode: 'copy' });
    const clip = messages.find((m) => m.op === 'clipboard');
    expect(clip?.content).toContain('Title,Billable');
    expect(clip?.content).toContain('Alpha,30');
    expect(clip?.content).not.toContain('badge');
  });

  test('reorders rows by orderedKeys', async () => {
    const table = new DataTableElement(rows, { columns, keyField: 'id', pageSize: 10 });
    await table.handleEvent('reorder', { orderedKeys: [5, 1, 2, 3, 4] });
    expect(table.getRows().map((r) => r.id)).toEqual([5, 1, 2, 3, 4]);
  });

  test('changes pageSize and resets to page 1', async () => {
    const table = new DataTableElement(rows, { columns, pageSize: 2 });
    await table.handleEvent('page', 2);
    expect(table.props.page).toBe(2);
    await table.handleEvent('pageSize', { pageSize: 10 });
    expect(table.props.pageSize).toBe(10);
    expect(table.props.page).toBe(1);
    expect(table.props.totalPages).toBe(1);
  });

  test('cellChange updates source row', async () => {
    const table = new DataTableElement(rows, {
      columns: [
        ...columns,
        { key: 'hours', header: 'Hours', editor: 'text' },
      ],
      keyField: 'id',
      pageSize: 10,
    });
    await table.handleEvent('cellChange', { rowKey: 1, columnKey: 'hours', value: 99 });
    expect(table.getRows().find((r) => r.id === 1)?.hours).toBe(99);
  });

  test('serializes editor and detailTrigger on columns', () => {
    const table = new DataTableElement(rows, {
      columns: [
        { key: 'title', header: 'Title', detailTrigger: true },
        {
          key: 'status',
          header: 'Status',
          editor: 'select',
          editorOptions: [
            { value: 'todo', label: 'Todo' },
            { value: 'done', label: 'Done' },
          ],
        },
      ],
      detail: (row) => {
        new Element('label', { text: String(row.title) });
      },
      pageSize: 10,
    });
    const cols = table.props.allColumns as Array<Record<string, unknown>>;
    expect(cols[0]?.detailTrigger).toBe(true);
    expect(cols[1]?.editor).toBe('select');
    expect(table.props.hasDetail).toBe(true);
    const detail = (table.props.rows as Array<Record<string, unknown>>)[0]?.__detail as {
      __ui: { type: string };
    };
    expect(detail?.__ui?.type).toBe('column');
  });

  test('viewChange updates activeView', async () => {
    const table = new DataTableElement(rows, {
      columns,
      views: [
        { id: 'outline', label: 'Outline', count: 5 },
        { id: 'past', label: 'Past', count: 0 },
      ],
      defaultView: 'outline',
    });
    await table.handleEvent('viewChange', { viewId: 'past' });
    expect(table.props.activeView).toBe('past');
  });

  test('view filter lenses rows and auto-counts badges', async () => {
    const table = new DataTableElement(rows, {
      columns,
      keyField: 'id',
      pageSize: 10,
      views: [
        { id: 'all', label: 'All' },
        {
          id: 'done',
          label: 'Done',
          filter: (row) => row.status === 'done',
        },
      ],
      defaultView: 'all',
    });

    const viewsAll = table.props.views as Array<{ id: string; count: number }>;
    expect(viewsAll.find((v) => v.id === 'all')?.count).toBe(5);
    expect(viewsAll.find((v) => v.id === 'done')?.count).toBe(2);
    expect(table.props.totalRows).toBe(5);

    await table.handleEvent('viewChange', { viewId: 'done' });
    expect(table.props.activeView).toBe('done');
    expect(table.props.totalRows).toBe(2);
    expect(table.props.rows.map((r: Record<string, unknown>) => r.title)).toEqual([
      'Alpha',
      'Charlie',
    ]);
    // filter functions must not be sent to the client
    expect(
      (table.props.views as Array<Record<string, unknown>>).every((v) => v.filter === undefined),
    ).toBe(true);
  });
});
