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
        'columnPin',
        'export',
        'page',
        'action',
        'bulkAction',
        'reorder',
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

  test('paginated reorder keeps off-page rows in place', async () => {
    const table = new DataTableElement(rows, { columns, keyField: 'id', pageSize: 2 });
    expect(table.props.rows.map((r: Record<string, unknown>) => r.id)).toEqual([1, 2]);
    await table.handleEvent('page', 2);
    expect(table.props.rows.map((r: Record<string, unknown>) => r.id)).toEqual([3, 4]);

    await table.handleEvent('reorder', { orderedKeys: [4, 3] });
    expect(table.getRows().map((r) => r.id)).toEqual([1, 2, 4, 3, 5]);
    expect(table.props.page).toBe(2);
    expect(table.props.rows.map((r: Record<string, unknown>) => r.id)).toEqual([4, 3]);
  });

  test('bulkAction invokes onBulkAction with selected keys', async () => {
    const calls: Array<{ actionId: string; rowKeys: Array<string | number> }> = [];
    const table = new DataTableElement(rows, {
      columns,
      keyField: 'id',
      pageSize: 10,
      selectable: true,
      bulkActions: [
        { id: 'archive', label: 'Archive' },
        { id: 'delete', label: 'Delete', variant: 'destructive' },
      ],
      onBulkAction: (actionId, rowKeys) => {
        calls.push({ actionId, rowKeys });
      },
    });
    expect(
      (table.props.bulkActions as Array<{ id: string }>).map((a) => a.id),
    ).toEqual(['archive', 'delete']);
    expect((table.props.events as string[]).includes('bulkAction')).toBe(true);

    await table.handleEvent('bulkAction', { actionId: 'archive', rowKeys: [1, 3, 99] });
    expect(calls).toEqual([{ actionId: 'archive', rowKeys: [1, 3] }]);

    await table.handleEvent('bulkAction', { actionId: 'missing', rowKeys: [1] });
    expect(calls).toHaveLength(1);
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

  test('groupBy column key partitions rows and stamps __groupKey', () => {
    const table = new DataTableElement(rows, {
      columns,
      keyField: 'id',
      pageSize: 10,
      groupBy: 'status',
    });
    expect(table.props.groupBy).toBe('status');
    const groups = table.props.groups as Array<{ key: string; label: string; count: number }>;
    expect(groups.map((g) => ({ key: g.key, count: g.count }))).toEqual([
      { key: 'done', count: 2 },
      { key: 'todo', count: 2 },
      { key: 'in progress', count: 1 },
    ]);
    expect(table.props.rows.map((r: Record<string, unknown>) => r.__groupKey)).toEqual([
      'done',
      'done',
      'todo',
      'todo',
      'in progress',
    ]);
    expect(table.props.rows.map((r: Record<string, unknown>) => r.title)).toEqual([
      'Alpha',
      'Charlie',
      'Bravo',
      'Delta',
      'Echo',
    ]);
  });

  test('groupBy function works and sort applies before grouping', async () => {
    const table = new DataTableElement(rows, {
      columns,
      keyField: 'id',
      pageSize: 10,
      groupBy: (row) => (Number(row.hours) >= 5 ? 'heavy' : 'light'),
    });
    expect(table.props.groupBy).toBe(true);
    await table.handleEvent('sort', { key: 'hours', dir: 'asc' });
    // sorted then stable-grouped by first appearance in sorted order
    expect(table.props.rows.map((r: Record<string, unknown>) => r.title)).toEqual([
      'Charlie',
      'Alpha',
      'Echo',
      'Delta',
      'Bravo',
    ]);
    expect(table.props.groups).toEqual([
      { key: 'light', label: 'light', count: 2 },
      { key: 'heavy', label: 'heavy', count: 3 },
    ]);
  });

  test('groupToggle invokes onGroupToggle', async () => {
    const seen: Array<{ key: string; collapsed: boolean }> = [];
    const table = new DataTableElement(rows, {
      columns,
      groupBy: 'status',
      pageSize: 10,
      onGroupToggle: (groupKey, collapsed) => {
        seen.push({ key: groupKey, collapsed });
      },
    });
    expect(table.props.events).toEqual(expect.arrayContaining(['groupToggle']));
    await table.handleEvent('groupToggle', { groupKey: 'done', collapsed: true });
    expect(seen).toEqual([{ key: 'done', collapsed: true }]);
  });

  test('facet column filters by exact multi-select JSON payload', async () => {
    const table = new DataTableElement(rows, {
      columns: [
        { key: 'title', header: 'Title' },
        {
          key: 'status',
          header: 'Status',
          filter: 'facet',
          facetOptions: [
            { value: 'todo', label: 'Todo' },
            { value: 'done', label: 'Done' },
            { value: 'in progress', label: 'In progress' },
          ],
        },
      ],
      pageSize: 10,
    });
    const statusCol = (table.props.columns as Array<Record<string, unknown>>).find(
      (c) => c.key === 'status',
    );
    expect(statusCol?.filter).toBe('facet');
    const opts = statusCol?.facetOptions as Array<{ value: string; count?: number }>;
    expect(opts.map((o) => o.value).sort()).toEqual(['done', 'in progress', 'todo']);
    expect(opts.find((o) => o.value === 'done')?.count).toBe(2);

    await table.handleEvent('columnFilter', {
      key: 'status',
      value: JSON.stringify(['done', 'todo']),
    });
    expect(table.props.columnFilters).toEqual({
      status: JSON.stringify(['done', 'todo']),
    });
    expect(table.props.rows.map((r: Record<string, unknown>) => r.title).sort()).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
      'Delta',
    ]);

    await table.handleEvent('columnFilter', { key: 'status', value: JSON.stringify([]) });
    expect(table.props.columnFilters).toEqual({});
    expect(table.props.totalRows).toBe(5);
  });

  test('filter: facet without facetOptions derives distinct values', () => {
    const table = new DataTableElement(rows, {
      columns: [
        { key: 'title', header: 'Title' },
        { key: 'status', header: 'Status', filter: 'facet' },
      ],
      pageSize: 10,
    });
    const statusCol = (table.props.columns as Array<Record<string, unknown>>).find(
      (c) => c.key === 'status',
    );
    const opts = statusCol?.facetOptions as Array<{ value: string; label: string }>;
    expect(opts.map((o) => o.value).sort()).toEqual(['done', 'in progress', 'todo']);
  });

  test('loading and empty props sync; setLoading toggles', () => {
    const table = new DataTableElement([], {
      columns: [{ key: 'title', header: 'Title' }],
      loading: true,
      emptyTitle: 'Nothing yet',
      emptyDescription: 'Add a row.',
      pageSize: 10,
    });
    expect(table.props.loading).toBe(true);
    expect(table.props.emptyTitle).toBe('Nothing yet');
    expect(table.props.emptyDescription).toBe('Add a row.');
    table.setLoading(false);
    expect(table.props.loading).toBe(false);
  });

  test('manualPagination uses totalRows and does not slice', async () => {
    const pages: number[] = [];
    const pageRows = rows.slice(0, 2);
    const table = new DataTableElement(pageRows, {
      columns,
      keyField: 'id',
      pageSize: 2,
      manualPagination: true,
      totalRows: 20,
      onPageChange: (page) => {
        pages.push(page);
      },
    });
    expect(table.props.manualPagination).toBe(true);
    expect(table.props.totalRows).toBe(20);
    expect(table.props.totalPages).toBe(10);
    expect((table.props.rows as unknown[]).length).toBe(2);

    await table.handleEvent('page', 3);
    expect(table.props.page).toBe(3);
    expect(pages).toEqual([3]);
    // Still showing the supplied page rows (app would setRows after fetch).
    expect((table.props.rows as unknown[]).length).toBe(2);

    await table.handleEvent('page', 10);
    expect(table.props.page).toBe(10);
    table.setTotalRows(5);
    expect(table.props.totalRows).toBe(5);
    expect(table.props.totalPages).toBe(3);
    expect(table.props.page).toBe(3); // clamped to totalPages
  });

  test('manualPagination setRows keeps current page', async () => {
    const table = new DataTableElement(rows.slice(0, 2), {
      columns,
      keyField: 'id',
      pageSize: 2,
      manualPagination: true,
      totalRows: 20,
    });
    await table.handleEvent('page', 4);
    expect(table.props.page).toBe(4);
    table.setRows(rows.slice(2, 4));
    expect(table.props.page).toBe(4);
    expect((table.props.rows as Array<{ id: number }>)[0]?.id).toBe(3);
  });

  test('density and zebra sync; setters update props', () => {
    const table = new DataTableElement(rows, {
      columns,
      density: 'compact',
      zebra: true,
      pageSize: 10,
    });
    expect(table.props.density).toBe('compact');
    expect(table.props.zebra).toBe(true);
    table.setDensity('comfortable');
    table.setZebra(false);
    expect(table.props.density).toBe('comfortable');
    expect(table.props.zebra).toBe(false);
  });

  test('number / date / boolean editors coerce cellChange values', async () => {
    const changes: Array<{ key: string; value: unknown }> = [];
    const table = new DataTableElement(
      [
        {
          id: 1,
          hours: 3,
          due: '2026-01-15',
          active: false,
        },
      ],
      {
        keyField: 'id',
        pageSize: 10,
        columns: [
          { key: 'hours', header: 'Hours', editor: 'number' },
          { key: 'due', header: 'Due', editor: 'date' },
          { key: 'active', header: 'Active', editor: 'boolean' },
        ],
        onCellChange: (_rowKey, columnKey, value) => {
          changes.push({ key: columnKey, value });
        },
      },
    );
    const cols = table.props.columns as Array<{ editor?: string }>;
    expect(cols.map((c) => c.editor)).toEqual(['number', 'date', 'boolean']);

    await table.handleEvent('cellChange', { rowKey: 1, columnKey: 'hours', value: '12' });
    await table.handleEvent('cellChange', { rowKey: 1, columnKey: 'due', value: '2026-08-01' });
    await table.handleEvent('cellChange', { rowKey: 1, columnKey: 'active', value: true });
    expect(changes).toEqual([
      { key: 'hours', value: 12 },
      { key: 'due', value: '2026-08-01' },
      { key: 'active', value: true },
    ]);
    const stored = table.getRows()[0]!;
    expect(stored.hours).toBe(12);
    expect(stored.due).toBe('2026-08-01');
    expect(stored.active).toBe(true);
  });

  test('multi-sort via multi flag and sorts payload', async () => {
    const table = new DataTableElement(rows, { columns, pageSize: 10 });
    await table.handleEvent('sort', { key: 'status', dir: 'asc' });
    await table.handleEvent('sort', { key: 'hours', multi: true, dir: 'asc' });
    expect(table.props.sorts).toEqual([
      { key: 'status', dir: 'asc' },
      { key: 'hours', dir: 'asc' },
    ]);
    expect(table.props.sortKey).toBe('status');
    expect(table.props.sortDir).toBe('asc');
    expect(table.props.rows.map((r: Record<string, unknown>) => r.title)).toEqual([
      'Charlie',
      'Alpha',
      'Echo',
      'Delta',
      'Bravo',
    ]);

    await table.handleEvent('sort', {
      sorts: [
        { key: 'hours', dir: 'desc' },
        { key: 'title', dir: 'asc' },
      ],
    });
    expect(table.getSorts()).toEqual([
      { key: 'hours', dir: 'desc' },
      { key: 'title', dir: 'asc' },
    ]);
    expect(table.props.rows.map((r: Record<string, unknown>) => r.hours)).toEqual([
      10, 7, 5, 3, 1,
    ]);
  });

  test('footer aggregates over filtered rows; page-only when manualPagination', async () => {
    const table = new DataTableElement(rows, {
      columns: [
        ...columns.slice(0, 3),
        { key: 'hours', header: 'Hours', align: 'right', aggregate: 'sum' },
      ],
      pageSize: 10,
    });
    expect(table.props.footer).toEqual({ hours: 26 });

    await table.handleEvent('filter', 'done');
    expect(table.props.footer).toEqual({ hours: 4 });

    const remote = new DataTableElement(rows.slice(0, 2), {
      columns: [
        { key: 'title', header: 'Title' },
        { key: 'hours', header: 'Hours', aggregate: 'sum' },
      ],
      pageSize: 2,
      manualPagination: true,
      totalRows: 5,
    });
    expect(remote.props.footer).toEqual({ hours: 13 });
  });

  test('column pin reorders visible columns and emits via columnPin', async () => {
    const table = new DataTableElement(rows, {
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'title', header: 'Title', pin: 'left' },
        { key: 'status', header: 'Status' },
        { key: 'hours', header: 'Hours', pin: 'right' },
      ],
      pageSize: 10,
    });
    expect(table.props.columns.map((c: { key: string; pin?: string }) => [c.key, c.pin])).toEqual([
      ['title', 'left'],
      ['id', undefined],
      ['status', undefined],
      ['hours', 'right'],
    ]);

    await table.handleEvent('columnPin', { key: 'status', pin: 'left' });
    expect(table.props.columns.map((c: { key: string }) => c.key)).toEqual([
      'title',
      'status',
      'id',
      'hours',
    ]);
    await table.handleEvent('columnPin', { key: 'title', pin: null });
    expect(
      (table.props.columns as Array<{ key: string; pin?: string }>).find((c) => c.key === 'title')
        ?.pin,
    ).toBeUndefined();
  });

  test('manualPagination skips local filter/sort and fires change callbacks', async () => {
    const sortsLog: unknown[] = [];
    const filters: string[] = [];
    const columnFilterLogs: Record<string, string>[] = [];
    const table = new DataTableElement(rows.slice(0, 2), {
      columns,
      keyField: 'id',
      pageSize: 2,
      manualPagination: true,
      totalRows: 5,
      onSortChange: (sorts) => {
        sortsLog.push(sorts);
      },
      onFilterChange: (filter) => {
        filters.push(filter);
      },
      onColumnFilterChange: (next) => {
        columnFilterLogs.push(next);
      },
    });
    expect(table.props.manualFiltering).toBe(true);
    expect(table.props.manualSorting).toBe(true);
    // Overrides cannot re-enable local pipeline under manualPagination.
    const forced = new DataTableElement(rows.slice(0, 2), {
      columns,
      pageSize: 2,
      manualPagination: true,
      totalRows: 5,
      manualFiltering: false,
      manualSorting: false,
    });
    expect(forced.props.manualFiltering).toBe(true);
    expect(forced.props.manualSorting).toBe(true);

    await table.handleEvent('sort', { key: 'hours', dir: 'asc' });
    await table.handleEvent('filter', 'Alpha');
    await table.handleEvent('columnFilter', { key: 'status', value: 'todo' });
    expect(sortsLog).toEqual([[{ key: 'hours', dir: 'asc' }]]);
    expect(filters).toEqual(['Alpha']);
    expect(columnFilterLogs).toEqual([{ status: 'todo' }]);
    // Still the supplied page — not filtered/sorted locally.
    expect(table.props.rows.map((r: Record<string, unknown>) => r.title)).toEqual([
      'Alpha',
      'Bravo',
    ]);
    expect(table.props.sortKey).toBe('hours');
    expect(table.props.filter).toBe('Alpha');
    expect(table.props.columnFilters).toEqual({ status: 'todo' });
    expect(table.getQuery()).toEqual({
      page: 1,
      pageSize: 2,
      filter: 'Alpha',
      columnFilters: { status: 'todo' },
      sorts: [{ key: 'hours', dir: 'asc' }],
    });
  });

  test('remote getQuery tracks page / pageSize; page accepts { page }', async () => {
    const pages: number[] = [];
    const sizes: number[] = [];
    const table = new DataTableElement(rows.slice(0, 2), {
      columns,
      keyField: 'id',
      pageSize: 2,
      manualPagination: true,
      totalRows: 20,
      onPageChange: (page) => {
        pages.push(page);
      },
      onPageSizeChange: (size) => {
        sizes.push(size);
      },
    });

    await table.handleEvent('page', { page: 3 });
    expect(table.getPage()).toBe(3);
    expect(pages).toEqual([3]);
    expect(table.getQuery().page).toBe(3);

    await table.handleEvent('pageSize', { pageSize: 5 });
    expect(sizes).toEqual([5]);
    expect(table.getPage()).toBe(1);
    expect(table.getPageSize()).toBe(5);
    expect(table.getQuery()).toMatchObject({ page: 1, pageSize: 5 });
  });

  test('filter and sort reset page in remote mode without changing rows', async () => {
    const table = new DataTableElement(rows.slice(0, 2), {
      columns,
      keyField: 'id',
      pageSize: 2,
      manualPagination: true,
      totalRows: 20,
    });
    await table.handleEvent('page', 4);
    expect(table.getPage()).toBe(4);
    await table.handleEvent('filter', 'x');
    expect(table.getPage()).toBe(1);
    expect(table.getFilter()).toBe('x');
    expect(table.props.rows.map((r: Record<string, unknown>) => r.id)).toEqual([1, 2]);

    await table.handleEvent('page', 2);
    await table.handleEvent('sort', { key: 'title', dir: 'desc' });
    expect(table.getPage()).toBe(1);
    expect(table.getSorts()).toEqual([{ key: 'title', dir: 'desc' }]);
  });

  test('withLoading toggles loading around refetch; empty props stay settled', async () => {
    const table = new DataTableElement(rows.slice(0, 2), {
      columns,
      keyField: 'id',
      pageSize: 2,
      manualPagination: true,
      totalRows: 2,
      emptyTitle: 'No matches',
      emptyDescription: 'Try another query.',
    });
    expect(table.isLoading()).toBe(false);
    expect(table.props.emptyTitle).toBe('No matches');

    let sawLoading = false;
    await table.withLoading(async () => {
      sawLoading = table.isLoading() && table.props.loading === true;
      // Previous rows still present while loading (avoid empty flash).
      expect((table.props.rows as unknown[]).length).toBe(2);
      table.setRows([]);
      table.setTotalRows(0);
    });
    expect(sawLoading).toBe(true);
    expect(table.isLoading()).toBe(false);
    expect(table.props.loading).toBe(false);
    expect((table.props.rows as unknown[]).length).toBe(0);
    expect(table.getTotalRows()).toBe(0);
    expect(table.props.emptyTitle).toBe('No matches');
  });

  test('manualFiltering alone skips filter but still sorts and pages locally', async () => {
    const filters: string[] = [];
    const table = new DataTableElement(rows, {
      columns,
      keyField: 'id',
      pageSize: 2,
      manualFiltering: true,
      onFilterChange: (f) => {
        filters.push(f);
      },
    });
    expect(table.props.manualPagination).toBe(false);
    expect(table.props.manualFiltering).toBe(true);
    expect(table.props.manualSorting).toBe(false);

    await table.handleEvent('filter', 'Alpha');
    expect(filters).toEqual(['Alpha']);
    // Not filtered locally — still first page of all rows.
    expect(table.props.rows.map((r: Record<string, unknown>) => r.title)).toEqual([
      'Alpha',
      'Bravo',
    ]);
    expect(table.props.totalRows).toBe(5);

    await table.handleEvent('sort', { key: 'hours', dir: 'asc' });
    expect(table.props.rows.map((r: Record<string, unknown>) => r.hours)).toEqual([1, 3]);
    expect(table.props.totalRows).toBe(5);
  });

  test('manualSorting alone skips sort but still filters and pages locally', async () => {
    const sortsLog: unknown[] = [];
    const table = new DataTableElement(rows, {
      columns,
      keyField: 'id',
      pageSize: 10,
      manualSorting: true,
      onSortChange: (s) => {
        sortsLog.push(s);
      },
    });
    await table.handleEvent('sort', { key: 'hours', dir: 'asc' });
    expect(sortsLog).toEqual([[{ key: 'hours', dir: 'asc' }]]);
    // Order unchanged (source order).
    expect(table.props.rows.map((r: Record<string, unknown>) => r.hours)).toEqual([
      3, 10, 1, 7, 5,
    ]);

    await table.handleEvent('filter', 'done');
    expect(table.props.rows.map((r: Record<string, unknown>) => r.title)).toEqual([
      'Alpha',
      'Charlie',
    ]);
  });

  test('manualPagination ignores groupBy and keeps groups empty', () => {
    const table = new DataTableElement(rows.slice(0, 3), {
      columns,
      pageSize: 3,
      manualPagination: true,
      totalRows: 3,
      groupBy: 'status',
    });
    expect(table.props.groupBy).toBeNull();
    expect(table.props.groups).toEqual([]);
    expect((table.props.rows as unknown[]).length).toBe(3);
  });
});
