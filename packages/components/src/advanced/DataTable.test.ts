import { describe, expect, test } from 'bun:test';
import { dataTable } from './DataTable';

type Row = { id: number; name: string; amount: number };

const data: Row[] = [
  { id: 1, name: 'Alice', amount: 30 },
  { id: 2, name: 'Bob', amount: 10 },
  { id: 3, name: 'Carol', amount: 50 },
];

describe('DataTable', () => {
  test('static mode renders without event handlers', () => {
    const html = dataTable(data, {
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
      ],
      keyField: 'id',
    }).render();

    expect(html).toContain('<table');
    expect(html).toContain('Alice');
    expect(html).not.toContain('data-on:click');
  });

  test('interactive mode wires sort and pagination', () => {
    const html = dataTable(data, {
      key: 'test-table',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'amount', header: 'Amount', sortable: true },
      ],
      keyField: 'id',
      sortable: true,
      searchable: true,
      paginate: true,
      pageSize: 2,
    }).render();

    expect(html).toContain('data-badui-table');
    expect(html).toContain('data-on:click');
    expect(html).toContain("evtType='sort'");
    expect(html).toContain('type="search"');
    expect(html).toContain('Showing');
  });

  test('selectable mode renders checkboxes with handlers', () => {
    const html = dataTable(data, {
      key: 'sel-table',
      columns: [{ key: 'name', header: 'Name' }],
      keyField: 'id',
      selectable: true,
    }).render();

    expect(html).toContain('select_row');
    expect(html).toContain('select_all');
    expect(html).toContain('checkbox');
  });

  test('grouped mode renders group headers', () => {
    const rows = [
      { id: 1, name: 'A', status: 'done' },
      { id: 2, name: 'B', status: 'todo' },
    ];
    const html = dataTable(rows, {
      key: 'grp-table',
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'status', header: 'Status' },
      ],
      keyField: 'id',
      groupBy: 'status',
    }).render();

    expect(html).toContain('toggle_group');
    expect(html).toContain('done');
    expect(html).toContain('todo');
  });

  test('enhanced mode includes client script attributes', () => {
    const html = dataTable(data, {
      key: 'enh-table',
      columns: [{ key: 'name', header: 'Name', editable: true }],
      keyField: 'id',
      rowReorder: true,
      columnReorder: true,
      editable: true,
    }).render();

    expect(html).toContain('data-badui-table-enhanced');
    expect(html).toContain('data-draggable-col');
    expect(html).toContain('data-draggable-row');
    expect(html).toContain('data-editable');
  });

  test('column visibility renders dropdown', () => {
    const html = dataTable(data, {
      key: 'col-vis',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
      ],
      keyField: 'id',
      columnVisibility: true,
    }).render();

    expect(html).toContain('toggle_column');
    expect(html).toContain('Columns');
  });
});
