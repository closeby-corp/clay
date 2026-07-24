import { ui } from '@badui/ui';

const rows = [
  { id: 1, name: 'Alpha', role: 'Admin', status: 'active' },
  { id: 2, name: 'Bravo', role: 'Editor', status: 'active' },
  { id: 3, name: 'Charlie', role: 'Viewer', status: 'inactive' },
  { id: 4, name: 'Delta', role: 'Editor', status: 'active' },
  { id: 5, name: 'Echo', role: 'Admin', status: 'inactive' },
];

ui.page('/examples/datatable', () => {
  let sortKey: 'id' | 'name' | 'role' | 'status' = 'id';
  let ascending = true;

  ui.column(() => {
    ui.label('DataTable').classes('text-3xl font-bold');
    ui.label('Simplified table — full NiceGUI/DataTable features come later.')
      .classes('text-muted-foreground');

    const tableUi = ui.refreshable(() => {
      const sorted = [...rows].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av < bv) return ascending ? -1 : 1;
        if (av > bv) return ascending ? 1 : -1;
        return 0;
      });

      ui.row(() => {
        for (const key of ['id', 'name', 'role', 'status'] as const) {
          ui.button(`Sort ${key}`, {
            size: 'sm',
            variant: sortKey === key ? 'default' : 'outline',
            onClick: () => {
              if (sortKey === key) ascending = !ascending;
              else {
                sortKey = key;
                ascending = true;
              }
              tableUi.refresh();
            },
          });
        }
      }, { gap: 2 });

      ui.dataTable(sorted, {
        columns: [
          { key: 'id', header: 'ID' },
          { key: 'name', header: 'Name' },
          { key: 'role', header: 'Role' },
          { key: 'status', header: 'Status' },
        ],
      });
    });
  }, { gap: 3 });
});
