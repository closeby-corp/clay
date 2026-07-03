import { ui } from '@badui/ui';

type Task = {
  id: number;
  title: string;
  assignee: string;
  priority: string;
  hours: number;
  status: string;
};

ui.page('/examples/datatable', () => {
  let tasks: Task[] = [
    { id: 1, title: 'Design homepage', assignee: 'Alice', priority: 'high', hours: 8, status: 'done' },
    { id: 2, title: 'API integration', assignee: 'Bob', priority: 'medium', hours: 12, status: 'in-progress' },
    { id: 3, title: 'Write tests', assignee: 'Carol', priority: 'high', hours: 6, status: 'todo' },
    { id: 4, title: 'Fix login bug', assignee: 'Dave', priority: 'high', hours: 3, status: 'in-progress' },
    { id: 5, title: 'Update docs', assignee: 'Eve', priority: 'low', hours: 4, status: 'todo' },
    { id: 6, title: 'Deploy staging', assignee: 'Frank', priority: 'medium', hours: 2, status: 'done' },
    { id: 7, title: 'Code review', assignee: 'Grace', priority: 'low', hours: 1, status: 'done' },
    { id: 8, title: 'Database migration', assignee: 'Henry', priority: 'high', hours: 10, status: 'todo' },
    { id: 9, title: 'UI polish', assignee: 'Ivy', priority: 'medium', hours: 5, status: 'in-progress' },
    { id: 10, title: 'Performance audit', assignee: 'Jack', priority: 'medium', hours: 8, status: 'todo' },
    { id: 11, title: 'Security scan', assignee: 'Kate', priority: 'high', hours: 4, status: 'done' },
    { id: 12, title: 'Onboarding flow', assignee: 'Leo', priority: 'low', hours: 6, status: 'in-progress' },
    { id: 13, title: 'Analytics setup', assignee: 'Mia', priority: 'medium', hours: 3, status: 'todo' },
    { id: 14, title: 'Email templates', assignee: 'Noah', priority: 'low', hours: 2, status: 'done' },
    { id: 15, title: 'Mobile layout', assignee: 'Olivia', priority: 'high', hours: 9, status: 'in-progress' },
    { id: 16, title: 'Cache layer', assignee: 'Paul', priority: 'medium', hours: 7, status: 'todo' },
    { id: 17, title: 'Error monitoring', assignee: 'Quinn', priority: 'high', hours: 4, status: 'done' },
    { id: 18, title: 'Refactor auth', assignee: 'Rose', priority: 'medium', hours: 11, status: 'in-progress' },
    { id: 19, title: 'Load testing', assignee: 'Sam', priority: 'low', hours: 5, status: 'todo' },
    { id: 20, title: 'Release notes', assignee: 'Tina', priority: 'low', hours: 1, status: 'done' },
  ];

  ui.column(() => {
    ui.label('DataTable Demo').classes('text-3xl font-bold');
    ui.label('Selection, grouping, reorder, and inline editing').classes('text-base opacity-70 mb-4');

    ui.dataTable(tasks, {
      key: 'tasks',
      keyField: 'id',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'title', header: 'Title', sortable: true, editable: true },
        { key: 'assignee', header: 'Assignee', sortable: true, editable: true },
        { key: 'priority', header: 'Priority', sortable: true, editable: true, editor: 'select', options: [
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' },
        ]},
        { key: 'hours', header: 'Hours', sortable: true, editable: true, editor: 'number', align: 'right' },
        {
          key: 'status',
          header: 'Status',
          sortable: true,
          editable: true,
          editor: 'select',
          options: [
            { label: 'To Do', value: 'todo' },
            { label: 'In Progress', value: 'in-progress' },
            { label: 'Done', value: 'done' },
          ],
          render: (row) => {
            const color = row.status === 'done' ? 'success' : row.status === 'in-progress' ? 'warning' : 'neutral';
            return `<span class="badge badge-${color}">${row.status}</span>`;
          },
        },
      ],
      sortable: true,
      searchable: true,
      paginate: true,
      pageSize: 8,
      selectable: true,
      selectAllMode: 'filtered',
      groupBy: 'status',
      columnVisibility: true,
      columnReorder: true,
      rowReorder: true,
      editable: true,
      hover: true,
      striped: true,
      on_cell_edit: (row, key, value) => {
        const idx = tasks.findIndex((t) => t.id === row.id);
        if (idx < 0) return;
        if (key === 'hours') {
          tasks[idx] = { ...tasks[idx], hours: Number(value) || 0 };
        } else {
          tasks[idx] = { ...tasks[idx], [key]: value };
        }
      },
      on_row_reorder: (orderedIds) => {
        tasks = orderedIds.map((id) => tasks.find((t) => t.id === Number(id))!);
      },
      on_selection_change: (ids) => {
        console.log('Selected:', ids);
      },
    });
  });
});
