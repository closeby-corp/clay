import { ui } from '@badui/ui';
import type { DataTableDensity, DataTableElement } from '@badui/ui';
import { exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'DataTable',
  icon: 'table-2',
  order: 60,
};

type Task = {
  id: number;
  title: string;
  status: string;
  hours: number;
  owner: string;
  due: string;
  active: boolean;
};

const seed: Task[] = [
  { id: 1, title: 'Design landing hero', status: 'done', hours: 6, owner: 'Ada', due: '2026-01-10', active: false },
  { id: 2, title: 'Wire DataTable events', status: 'in progress', hours: 8, owner: 'Lin', due: '2026-02-01', active: true },
  { id: 3, title: 'Write element docs', status: 'todo', hours: 3, owner: 'Sam', due: '2026-02-15', active: true },
  { id: 4, title: 'Fix slider binding', status: 'done', hours: 2, owner: 'Ada', due: '2026-01-20', active: false },
  { id: 5, title: 'Polish dashboard stats', status: 'todo', hours: 4, owner: 'Kai', due: '2026-03-01', active: true },
  { id: 6, title: 'Add chat persistence', status: 'in progress', hours: 10, owner: 'Lin', due: '2026-03-12', active: true },
  { id: 7, title: 'Review form demo', status: 'done', hours: 1, owner: 'Sam', due: '2026-01-05', active: false },
  { id: 8, title: 'Ship client rebuild', status: 'todo', hours: 5, owner: 'Kai', due: '2026-04-01', active: true },
  { id: 9, title: 'Triage upload bugs', status: 'in progress', hours: 7, owner: 'Ada', due: '2026-02-28', active: true },
  { id: 10, title: 'Sketch refreshable API', status: 'done', hours: 4, owner: 'Lin', due: '2026-01-30', active: false },
  { id: 11, title: 'Benchmark patch bus', status: 'todo', hours: 9, owner: 'Sam', due: '2026-05-01', active: true },
  { id: 12, title: 'Normalize badge styles', status: 'done', hours: 2, owner: 'Kai', due: '2026-01-18', active: false },
  { id: 13, title: 'Document protocol', status: 'in progress', hours: 6, owner: 'Ada', due: '2026-03-20', active: true },
  { id: 14, title: 'Add select options', status: 'todo', hours: 3, owner: 'Lin', due: '2026-04-10', active: true },
  { id: 15, title: 'Harden WebSocket reconnect', status: 'todo', hours: 11, owner: 'Sam', due: '2026-06-01', active: true },
  { id: 16, title: 'Improve home links', status: 'done', hours: 1, owner: 'Kai', due: '2026-01-12', active: false },
  { id: 17, title: 'Audit checkbox a11y', status: 'in progress', hours: 5, owner: 'Ada', due: '2026-03-05', active: true },
  { id: 18, title: 'Cut release notes', status: 'todo', hours: 2, owner: 'Lin', due: '2026-04-20', active: true },
  { id: 19, title: 'Tune pagination UX', status: 'done', hours: 3, owner: 'Sam', due: '2026-02-10', active: false },
  { id: 20, title: 'Demo row actions', status: 'in progress', hours: 4, owner: 'Kai', due: '2026-03-28', active: true },
];

const DENSITIES: DataTableDensity[] = ['compact', 'default', 'comfortable'];
const OWNERS = ['Ada', 'Lin', 'Sam', 'Kai'] as const;
const STATUSES = ['todo', 'in progress', 'done'] as const;

/** Enough rows that client virtualization engages (≥40 body items, reorder off). */
const LARGE_ROW_COUNT = 64;
const largeSeed: Task[] = Array.from({ length: LARGE_ROW_COUNT }, (_, i) => {
  const n = i + 1;
  const base = seed[i % seed.length]!;
  return {
    id: 1000 + n,
    title: `${base.title} #${n}`,
    status: STATUSES[i % STATUSES.length]!,
    hours: ((i * 3) % 12) + 1,
    owner: OWNERS[i % OWNERS.length]!,
    due: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    active: i % 3 !== 0,
  };
});

ui.page('/examples/datatable', () => {
  let tasks = seed.map((t) => ({ ...t }));
  let nextId = tasks.length + 1;
  let table: DataTableElement;
  let loadingDemo: DataTableElement;
  let remoteTable: DataTableElement | undefined;
  let density: DataTableDensity = 'default';
  let zebra = true;
  let chromeUi: ReturnType<typeof ui.refreshable>;
  let remoteStatusUi: ReturnType<typeof ui.refreshable>;

  const matchesColumnFilters = (
    row: Task,
    columnFilters: Record<string, string>,
  ): boolean => {
    for (const [key, raw] of Object.entries(columnFilters)) {
      if (!raw.trim()) continue;
      const cell = String((row as Record<string, unknown>)[key] ?? '');
      if (raw.trim().startsWith('[')) {
        try {
          const selected = JSON.parse(raw) as unknown;
          if (Array.isArray(selected) && selected.length > 0) {
            if (!selected.map(String).includes(cell)) return false;
            continue;
          }
        } catch {
          /* fall through to substring match */
        }
      }
      if (!cell.toLowerCase().includes(raw.trim().toLowerCase())) return false;
    }
    return true;
  };

  const loadRemotePage = async () => {
    const remote = remoteTable;
    if (!remote) return;
    await remote.withLoading(async () => {
      await new Promise((r) => setTimeout(r, 180));
      const { page, pageSize, filter, columnFilters, sorts } = remote.getQuery();
      let pool = [...tasks];
      const q = filter.trim().toLowerCase();
      if (q) {
        pool = pool.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.status.toLowerCase().includes(q) ||
            t.owner.toLowerCase().includes(q),
        );
      }
      pool = pool.filter((t) => matchesColumnFilters(t, columnFilters));
      if (sorts.length > 0) {
        pool = [...pool].sort((a, b) => {
          for (const { key, dir } of sorts) {
            const av = (a as Record<string, unknown>)[key];
            const bv = (b as Record<string, unknown>)[key];
            const cmp =
              typeof av === 'number' && typeof bv === 'number'
                ? av - bv
                : String(av ?? '').localeCompare(String(bv ?? ''), undefined, {
                    numeric: true,
                    sensitivity: 'base',
                  });
            if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
          }
          return 0;
        });
      }
      const start = (page - 1) * pageSize;
      // Keep previous rows visible under the spinner until this setRows.
      remote.setRows(pool.slice(start, start + pageSize));
      remote.setTotalRows(pool.length);
    });
    remoteStatusUi?.refresh();
  };

  ui.column(() => {
    ui.row(() => {
      exampleHeader(
        undefined,
        'Kitchen-sink DataTable: search, facets, edit, export, bulk actions, and the leftovers below.',
      );
      ui.button('Add task', {
        size: 'sm',
        onClick: async () => {
          const title = await ui.prompt('Task title', {
            title: 'New task',
            defaultValue: `New task ${nextId}`,
          });
          if (title == null) return;
          tasks = [
            ...tasks,
            {
              id: nextId++,
              title,
              status: 'todo',
              hours: 1,
              owner: 'You',
              due: '2026-08-09',
              active: true,
            },
          ];
          table.setRows(tasks);
          statusLabel.setText(`${tasks.length} tasks`);
          await loadRemotePage();
          ui.notify('Task added', 'success');
        },
      });
    }, { gap: 4 }).classes('items-start justify-between');

    exampleSection(
      'Feature tour',
      'Shift+click column headers to multi-sort · Title pinned left, Owner pinned right (Columns menu can re-pin) · Hours and Billable sum in the sticky footer · Reorder is on here, so row virtualization stays off (see the large table below).',
    );

    chromeUi = ui.refreshable(() => {
      ui.row(() => {
        ui.label('Density').classes('text-sm text-muted-foreground self-center');
        for (const d of DENSITIES) {
          ui.button(d, {
            size: 'sm',
            variant: density === d ? 'default' : 'outline',
            onClick: () => {
              density = d;
              table.setDensity(d);
              chromeUi.refresh();
            },
          });
        }
        ui.label('Zebra').classes('text-sm text-muted-foreground self-center ml-2');
        ui.button(zebra ? 'On' : 'Off', {
          size: 'sm',
          variant: zebra ? 'default' : 'outline',
          onClick: () => {
            zebra = !zebra;
            table.setZebra(zebra);
            chromeUi.refresh();
          },
        });
      }, { gap: 2 }).classes('flex-wrap items-center');
    });

    const statusLabel = ui.label(`${tasks.length} tasks`).classes('text-sm text-muted-foreground');

    table = ui.dataTable(tasks, {
      keyField: 'id',
      searchable: true,
      searchPlaceholder: 'Search tasks…',
      selectable: true,
      reorderable: true,
      groupBy: 'status',
      pageSize: 8,
      pageSizeOptions: [5, 8, 10, 20],
      density,
      zebra,
      exportFilename: 'tasks',
      emptyTitle: 'No tasks',
      emptyDescription: 'Try clearing status facets or search.',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'title', header: 'Title', pin: 'left' },
        {
          key: 'status',
          header: 'Status',
          filter: 'facet',
          facetOptions: [
            { value: 'todo', label: 'Todo' },
            { value: 'in progress', label: 'In progress' },
            { value: 'done', label: 'Done' },
          ],
          value: (row) => row.status,
          render: (row) =>
            ui.badge(String(row.status), {
              color:
                row.status === 'done' ? 'green' : row.status === 'todo' ? 'slate' : 'amber',
            }),
        },
        { key: 'hours', header: 'Hours', align: 'right', editor: 'number', aggregate: 'sum' },
        { key: 'due', header: 'Due', editor: 'date' },
        { key: 'active', header: 'Active', align: 'center', editor: 'boolean' },
        {
          key: 'billable',
          header: 'Billable',
          align: 'right',
          aggregate: 'sum',
          value: (row) => Number(row.hours) * 50,
          render: (row) => `${row.hours}h → $${Number(row.hours) * 50}`,
        },
        {
          key: 'owner',
          header: 'Owner',
          filter: 'facet',
          pin: 'right',
        },
      ],
      defaultSorts: [
        { key: 'status', dir: 'asc' },
        { key: 'hours', dir: 'desc' },
      ],
      actions: [
        { id: 'edit', label: 'Rename', icon: 'pencil' },
        { id: 'status', label: 'Status', icon: 'refresh-cw' },
        { id: 'delete', label: 'Delete', icon: 'trash-2', variant: 'destructive' },
      ],
      onAction: async (actionId, row) => {
        if (actionId === 'delete') {
          const sure = await ui.confirm(`Delete “${row.title}”? This cannot be undone.`, {
            title: 'Delete task?',
            confirmLabel: 'Delete',
            confirmVariant: 'destructive',
          });
          if (!sure) return;
          tasks = tasks.filter((t) => t.id !== row.id);
          table.setRows(tasks);
          statusLabel.setText(`${tasks.length} tasks`);
          await loadRemotePage();
          ui.notify('Task deleted', 'success');
          return;
        }

        if (actionId === 'edit') {
          const next = await ui.prompt('New title', {
            title: 'Rename task',
            defaultValue: String(row.title ?? ''),
            confirmLabel: 'Save',
          });
          if (next == null) return;
          tasks = tasks.map((t) => (t.id === row.id ? { ...t, title: next } : t));
          table.setRows(tasks);
          await loadRemotePage();
          ui.notify('Task renamed', 'info');
          return;
        }

        if (actionId === 'status') {
          const status = await ui.choose('Set status', ['todo', 'in progress', 'done'], {
            title: 'Task status',
          });
          if (status == null) return;
          tasks = tasks.map((t) => (t.id === row.id ? { ...t, status } : t));
          table.setRows(tasks);
          await loadRemotePage();
          ui.notify(`Status → ${status}`, 'success');
        }
      },
      bulkActions: [
        { id: 'mark-done', label: 'Mark done', icon: 'check' },
        { id: 'delete', label: 'Delete', icon: 'trash-2', variant: 'destructive' },
      ],
      onBulkAction: async (actionId, rowKeys) => {
        const keySet = new Set(rowKeys.map(String));
        if (actionId === 'mark-done') {
          tasks = tasks.map((t) => (keySet.has(String(t.id)) ? { ...t, status: 'done' } : t));
          table.setRows(tasks);
          await loadRemotePage();
          ui.notify(`Marked ${rowKeys.length} done`, 'success');
          return;
        }
        if (actionId === 'delete') {
          const sure = await ui.confirm(`Delete ${rowKeys.length} selected task(s)?`, {
            title: 'Delete selected?',
            confirmLabel: 'Delete',
            confirmVariant: 'destructive',
          });
          if (!sure) return;
          tasks = tasks.filter((t) => !keySet.has(String(t.id)));
          table.setRows(tasks);
          statusLabel.setText(`${tasks.length} tasks`);
          await loadRemotePage();
          ui.notify('Selected tasks deleted', 'success');
        }
      },
      onReorder: () => {
        tasks = table.getRows() as Task[];
        ui.notify('Order updated', 'info');
      },
      onCellChange: (rowKey, columnKey, value) => {
        tasks = tasks.map((t) => {
          if (String(t.id) !== String(rowKey)) return t;
          if (columnKey === 'hours') {
            const hours = Number(value);
            return Number.isFinite(hours) ? { ...t, hours } : t;
          }
          if (columnKey === 'due') return { ...t, due: String(value ?? '') };
          if (columnKey === 'active') return { ...t, active: Boolean(value) };
          return t;
        });
        table.setRows(tasks);
      },
    });

    exampleSection(
      'Large table (virtualized)',
      `${LARGE_ROW_COUNT} rows, no pagination, reorder off — the client virtualizes the body once there are ≥40 items. Virtualization is disabled when reorder is enabled (kitchen-sink above). Shift+click to multi-sort; Title / Owner stay pinned left / right.`,
    );
    ui.dataTable(largeSeed, {
      keyField: 'id',
      searchable: true,
      searchPlaceholder: 'Search large set…',
      selectable: true,
      reorderable: false,
      pageSize: 0,
      density: 'compact',
      zebra: true,
      exportFilename: 'large-tasks',
      emptyTitle: 'No rows',
      emptyDescription: 'Clear search to restore the virtualized list.',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'title', header: 'Title', pin: 'left' },
        {
          key: 'status',
          header: 'Status',
          filter: 'facet',
          facetOptions: [
            { value: 'todo', label: 'Todo' },
            { value: 'in progress', label: 'In progress' },
            { value: 'done', label: 'Done' },
          ],
          value: (row) => row.status,
          render: (row) =>
            ui.badge(String(row.status), {
              color:
                row.status === 'done' ? 'green' : row.status === 'todo' ? 'slate' : 'amber',
            }),
        },
        { key: 'hours', header: 'Hours', align: 'right', aggregate: 'sum' },
        { key: 'due', header: 'Due' },
        {
          key: 'owner',
          header: 'Owner',
          filter: 'facet',
          pin: 'right',
          facetOptions: OWNERS.map((value) => ({ value, label: value })),
        },
      ],
      defaultSorts: [
        { key: 'status', dir: 'asc' },
        { key: 'hours', dir: 'desc' },
      ],
    });

    exampleSection(
      'Remote filter / sort / page',
      '`manualPagination` turns off local filter/sort/slice. Read `getQuery()`, refetch with `withLoading`, then `setRows` + `setTotalRows`. Facets use `onColumnFilterChange` the same way. Shift+click still builds a multi-sort list for the server.',
    );
    remoteStatusUi = ui.refreshable(() => {
      const q = remoteTable?.getQuery() ?? {
        page: 1,
        pageSize: 5,
        filter: '',
        columnFilters: {},
        sorts: [] as Array<{ key: string; dir: 'asc' | 'desc' }>,
      };
      const sortLabel =
        q.sorts.length === 0
          ? 'none'
          : q.sorts.map((s) => `${s.key} ${s.dir}`).join(' → ');
      const facetKeys = Object.keys(q.columnFilters).filter((k) => q.columnFilters[k]?.trim());
      const facetLabel = facetKeys.length === 0 ? '∅' : facetKeys.join(', ');
      ui.label(
        `Server state · filter “${q.filter || '∅'}” · facets ${facetLabel} · sort ${sortLabel} · page ${q.page}`,
      ).classes('text-sm text-muted-foreground');
    });
    remoteTable = ui.dataTable([], {
      keyField: 'id',
      manualPagination: true,
      totalRows: tasks.length,
      pageSize: 5,
      pageSizeOptions: [5, 10],
      searchable: true,
      searchPlaceholder: 'Remote search…',
      columnToggle: false,
      exportable: false,
      density: 'compact',
      zebra: true,
      emptyTitle: 'No matching rows',
      emptyDescription: 'Adjust search or clear sort, then paginate.',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'title', header: 'Title', pin: 'left' },
        {
          key: 'status',
          header: 'Status',
          filter: 'facet',
          facetOptions: [
            { value: 'todo', label: 'Todo' },
            { value: 'in progress', label: 'In progress' },
            { value: 'done', label: 'Done' },
          ],
        },
        {
          key: 'owner',
          header: 'Owner',
          filter: 'facet',
          facetOptions: [
            { value: 'Ada', label: 'Ada' },
            { value: 'Lin', label: 'Lin' },
            { value: 'Sam', label: 'Sam' },
            { value: 'Kai', label: 'Kai' },
            { value: 'You', label: 'You' },
          ],
        },
        { key: 'hours', header: 'Hours', align: 'right', aggregate: 'sum' },
      ],
      onPageChange: async () => {
        await loadRemotePage();
      },
      onPageSizeChange: async () => {
        await loadRemotePage();
      },
      onFilterChange: async () => {
        await loadRemotePage();
      },
      onColumnFilterChange: async () => {
        await loadRemotePage();
      },
      onSortChange: async () => {
        await loadRemotePage();
      },
    });
    void loadRemotePage();

    exampleSection(
      'Staged builder (`ui.table`)',
      '`.manualPagination()` / `.density()` / `.zebra()` sugar over the same DataTable element.',
    );
    ui.table(tasks.slice(0, 6))
      .id('id')
      .search('Search…')
      .pageSize(5, { options: [5, 10] })
      .density('comfortable')
      .zebra()
      .groupBy('status')
      .columns([
        { key: 'id', header: 'ID' },
        { key: 'title', header: 'Title' },
        { key: 'status', header: 'Status', filter: 'facet' },
        { key: 'owner', header: 'Owner' },
      ])
      .primaryAction('Add row', () => ui.notify('Builder primaryAction', 'info'))
      .bulkActions(
        [{ id: 'ping', label: 'Ping', icon: 'check' }],
        (_actionId, rowKeys) => ui.notify(`Bulk ping ${rowKeys.length}`, 'success'),
      )
      .build();

    exampleSection('Loading & empty', 'Toggle loading, or clear rows to see a custom empty state.');
    ui.row(() => {
      ui.button('Toggle loading', {
        size: 'sm',
        variant: 'outline',
        onClick: () => {
          const next = !(loadingDemo.props.loading === true);
          loadingDemo.setLoading(next);
        },
      });
      ui.button('Clear rows', {
        size: 'sm',
        variant: 'outline',
        onClick: () => loadingDemo.setRows([]),
      });
      ui.button('Restore rows', {
        size: 'sm',
        variant: 'outline',
        onClick: () => {
          loadingDemo.setLoading(false);
          loadingDemo.setRows(tasks.slice(0, 3));
        },
      });
    }, { gap: 2 });
    loadingDemo = ui.dataTable(tasks.slice(0, 3), {
      keyField: 'id',
      pageSize: 0,
      columnFilterable: false,
      columnToggle: false,
      exportable: false,
      emptyTitle: 'Nothing here yet',
      emptyDescription: 'Restore rows or add tasks above.',
      columns: [
        { key: 'title', header: 'Title' },
        { key: 'status', header: 'Status' },
      ],
    });

    exampleSection(
      'Key / value object',
      'ui.table(plainObject) — Key / Value rows with search.',
    );
    ui.table({
      host: 'localhost',
      port: 4000,
      env: 'demo',
      debug: true,
      features: { search: true, actions: true },
    })
      .pageSize(0)
      .search('Search config…')
      .build();
  }, { gap: 6 });
});
