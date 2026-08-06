import { ui } from '@badui/ui';
import type { DataTableElement } from '@badui/ui';
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
};

const seed: Task[] = [
  { id: 1, title: 'Design landing hero', status: 'done', hours: 6, owner: 'Ada' },
  { id: 2, title: 'Wire DataTable events', status: 'in progress', hours: 8, owner: 'Lin' },
  { id: 3, title: 'Write element docs', status: 'todo', hours: 3, owner: 'Sam' },
  { id: 4, title: 'Fix slider binding', status: 'done', hours: 2, owner: 'Ada' },
  { id: 5, title: 'Polish dashboard stats', status: 'todo', hours: 4, owner: 'Kai' },
  { id: 6, title: 'Add chat persistence', status: 'in progress', hours: 10, owner: 'Lin' },
  { id: 7, title: 'Review form demo', status: 'done', hours: 1, owner: 'Sam' },
  { id: 8, title: 'Ship client rebuild', status: 'todo', hours: 5, owner: 'Kai' },
  { id: 9, title: 'Triage upload bugs', status: 'in progress', hours: 7, owner: 'Ada' },
  { id: 10, title: 'Sketch refreshable API', status: 'done', hours: 4, owner: 'Lin' },
  { id: 11, title: 'Benchmark patch bus', status: 'todo', hours: 9, owner: 'Sam' },
  { id: 12, title: 'Normalize badge styles', status: 'done', hours: 2, owner: 'Kai' },
  { id: 13, title: 'Document protocol', status: 'in progress', hours: 6, owner: 'Ada' },
  { id: 14, title: 'Add select options', status: 'todo', hours: 3, owner: 'Lin' },
  { id: 15, title: 'Harden WebSocket reconnect', status: 'todo', hours: 11, owner: 'Sam' },
  { id: 16, title: 'Improve home links', status: 'done', hours: 1, owner: 'Kai' },
  { id: 17, title: 'Audit checkbox a11y', status: 'in progress', hours: 5, owner: 'Ada' },
  { id: 18, title: 'Cut release notes', status: 'todo', hours: 2, owner: 'Lin' },
  { id: 19, title: 'Tune pagination UX', status: 'done', hours: 3, owner: 'Sam' },
  { id: 20, title: 'Demo row actions', status: 'in progress', hours: 4, owner: 'Kai' },
];

ui.page('/examples/datatable', () => {
    let tasks = seed.map((t) => ({ ...t }));
    let nextId = tasks.length + 1;
    let table: DataTableElement;

    ui.column(() => {
      ui.row(() => {
        exampleHeader(
          undefined,
          'Computed columns, badge cells, row grouping, confirm / prompt / choose, and toasts.',
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
              },
            ];
            table.setRows(tasks);
            statusLabel.setText(`${tasks.length} tasks`);
            ui.notify('Task added', 'success');
          },
        });
      }, { gap: 4 }).classes('items-start justify-between');

      const statusLabel = ui.label(`${tasks.length} tasks`).classes('text-sm text-muted-foreground');

      table = ui.dataTable(tasks, {
        keyField: 'id',
        searchable: true,
        searchPlaceholder: 'Search tasks…',
        selectable: true,
        groupBy: 'status',
        pageSize: 8,
        pageSizeOptions: [5, 8, 10, 20],
        columns: [
          { key: 'id', header: 'ID' },
          { key: 'title', header: 'Title' },
          {
            key: 'status',
            header: 'Status',
            value: (row) => row.status,
            render: (row) =>
              ui.badge(String(row.status), {
                color:
                  row.status === 'done' ? 'green' : row.status === 'todo' ? 'slate' : 'amber',
              }),
          },
          { key: 'hours', header: 'Hours', align: 'right' },
          {
            key: 'billable',
            header: 'Billable',
            align: 'right',
            value: (row) => Number(row.hours) * 50,
            render: (row) => `${row.hours}h → $${Number(row.hours) * 50}`,
          },
          { key: 'owner', header: 'Owner' },
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
            ui.notify(`Status → ${status}`, 'success');
          }
        },
      });

      exampleSection('Key / value object', 'Pass a plain object and the table shows Key / Value rows.');
      ui.dataTable(
        {
          host: 'localhost',
          port: 4000,
          env: 'demo',
          debug: true,
          features: { search: true, actions: true },
        },
        { pageSize: 0, searchable: true, searchPlaceholder: 'Search config…' },
      );

      exampleSection(
        'Structured table API',
        'ui.table(data) staged builder — same DataTableElement as the props blob above (optional sugar).',
      );
      ui.table(tasks.slice(0, 6))
        .id('id')
        .columns([
          { key: 'id', header: 'ID' },
          { key: 'title', header: 'Title' },
          { key: 'status', header: 'Status' },
          { key: 'owner', header: 'Owner' },
        ])
        .search('Search…')
        .groupBy('status')
        .pageSize(5, { options: [5, 10] })
        .build();
    }, { gap: 6 });
});
