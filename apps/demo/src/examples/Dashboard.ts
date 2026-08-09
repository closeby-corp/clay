import { ui } from '@badui/ui';
import type { DataTableElement } from '@badui/ui';
import { exampleHeader } from '../chrome';
import documentsSeed from './dashboard-documents.json';
import visitorsSeed from './dashboard-visitors.json';

export const pageMeta = {
  label: 'Dashboard',
  icon: 'layout-dashboard',
  order: 50,
};

type DocumentRow = {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
};

const drawerChartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const reviewerOptions = [
  { value: 'Eddie Lake', label: 'Eddie Lake' },
  { value: 'Jamik Tashpulatov', label: 'Jamik Tashpulatov' },
  { value: 'Assign reviewer', label: 'Assign reviewer' },
];

ui.page('/examples/dashboard', () => {
    let revenue = 1250;
    let customers = 1234;
    let accounts = 45678;
    let growth = 4.5;
    let docs = (documentsSeed as DocumentRow[]).map((d) => ({ ...d }));
    let nextId = Math.max(...docs.map((d) => d.id), 0) + 1;
    let table: DataTableElement;
    let statsUi: ReturnType<typeof ui.refreshable>;

    ui.column(() => {
      ui.row(() => {
        exampleHeader(
          undefined,
          'Section cards, interactive visitors chart, and a polished documents DataTable.',
        );
        ui.button('Refresh stats', {
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            revenue += Math.random() * 40;
            customers += Math.floor(Math.random() * 20) - 5;
            accounts += Math.floor(Math.random() * 100);
            growth = Math.max(0.5, growth + (Math.random() - 0.45));
            statsUi.refresh();
          },
        });
      }, { gap: 4 }).classes('items-start justify-between');

      statsUi = ui.refreshable(() => {
        ui.stat([
          {
            title: 'Total Revenue',
            value: `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            trend: '+12.5%',
            trendDirection: 'up',
            footer: 'Trending up this month',
            description: 'Visitors for the last 6 months',
          },
          {
            title: 'New Customers',
            value: customers.toLocaleString(),
            trend: '-20%',
            trendDirection: 'down',
            footer: 'Down 20% this period',
            description: 'Acquisition needs attention',
          },
          {
            title: 'Active Accounts',
            value: accounts.toLocaleString(),
            trend: '+12.5%',
            trendDirection: 'up',
            footer: 'Strong user retention',
            description: 'Engagement exceed targets',
          },
          {
            title: 'Growth Rate',
            value: `${growth.toFixed(1)}%`,
            trend: '+4.5%',
            trendDirection: 'up',
            footer: 'Steady performance',
            description: 'Meets growth projections',
          },
        ]);
      });

      ui.areaChart({
        title: 'Total Visitors',
        description: 'Total for the last 3 months',
        interactive: true,
        data: visitorsSeed as Record<string, unknown>[],
        xKey: 'date',
        series: [
          { key: 'mobile', label: 'Mobile', color: 'var(--chart-2)' },
          { key: 'desktop', label: 'Desktop', color: 'var(--chart-1)' },
        ],
      });

      table = ui.dataTable(docs, {
        keyField: 'id',
        searchable: true,
        searchPlaceholder: 'Search sections…',
        columnFilterable: true,
        exportable: true,
        exportFilename: 'documents',
        columnToggle: true,
        selectable: true,
        reorderable: true,
        density: 'default',
        zebra: true,
        pageSize: 10,
        pageSizeOptions: [10, 20, 30, 40, 50],
        emptyTitle: 'No sections',
        emptyDescription: 'Add a section or clear filters to see documents again.',
        defaultSorts: [{ key: 'status', dir: 'asc' }],
        views: [
          { id: 'outline', label: 'Outline' },
          {
            id: 'past-performance',
            label: 'Past Performance',
            filter: (row) => row.status === 'Done',
          },
          {
            id: 'key-personnel',
            label: 'Key Personnel',
            filter: (row) =>
              Boolean(row.reviewer) && row.reviewer !== 'Assign reviewer',
          },
          {
            id: 'focus-documents',
            label: 'Focus Documents',
            filter: (row) =>
              row.type === 'Cover page' || row.type === 'Narrative',
          },
        ],
        defaultView: 'outline',
        primaryAction: { label: 'Add Section' },
        columns: [
          {
            key: 'header',
            header: 'Header',
            detailTrigger: true,
            pin: 'left',
          },
          {
            key: 'type',
            header: 'Section Type',
            filter: 'facet',
            render: (row) => ui.badge(String(row.type), { variant: 'outline' }),
          },
          {
            key: 'status',
            header: 'Status',
            filter: 'facet',
            facetOptions: [
              { value: 'Done', label: 'Done' },
              { value: 'In Process', label: 'In Process' },
            ],
            render: (row) =>
              ui.badge(String(row.status), {
                variant: 'outline',
                color: row.status === 'Done' ? 'green' : undefined,
              }),
          },
          {
            key: 'target',
            header: 'Target',
            align: 'right',
            editor: 'text',
            aggregate: 'sum',
            value: (row) => Number(row.target),
          },
          {
            key: 'limit',
            header: 'Limit',
            align: 'right',
            editor: 'text',
            aggregate: 'sum',
            value: (row) => Number(row.limit),
          },
          {
            key: 'reviewer',
            header: 'Reviewer',
            pin: 'right',
            filter: 'facet',
            editor: 'select',
            editorOptions: reviewerOptions,
          },
        ],
        actions: [
          { id: 'edit', label: 'Edit', icon: 'pencil' },
          { id: 'copy', label: 'Make a copy', icon: 'copy' },
          { id: 'favorite', label: 'Favorite', icon: 'star' },
          { id: 'delete', label: 'Delete', icon: 'trash-2', variant: 'destructive' },
        ],
        bulkActions: [
          { id: 'mark-done', label: 'Mark done', icon: 'check' },
          { id: 'delete', label: 'Delete', icon: 'trash-2', variant: 'destructive' },
        ],
        onBulkAction: async (actionId, rowKeys) => {
          const keySet = new Set(rowKeys.map(String));
          if (actionId === 'mark-done') {
            docs = docs.map((d) =>
              keySet.has(String(d.id)) ? { ...d, status: 'Done' } : d,
            );
            table.setRows(docs);
            ui.notify(`Marked ${rowKeys.length} done`, 'success');
            return;
          }
          if (actionId === 'delete') {
            const ok = await ui.confirm(`Delete ${rowKeys.length} selected section(s)?`, {
              confirmVariant: 'destructive',
            });
            if (!ok) return;
            docs = docs.filter((d) => !keySet.has(String(d.id)));
            table.setRows(docs);
            ui.notify('Selected sections deleted', 'success');
          }
        },
        detail: (row) => {
          ui.areaChart({
            data: drawerChartData,
            xKey: 'month',
            series: [
              { key: 'mobile', label: 'Mobile' },
              { key: 'desktop', label: 'Desktop' },
            ],
          });
          ui.label('Trending up by 5.2% this month').classes('font-medium');
          ui.label(
            'Showing total visitors for the last 6 months. This is sample detail content for the drawer.',
          ).classes('text-muted-foreground');
          ui.input({ label: 'Header', value: String(row.header ?? '') });
          ui.select({
            label: 'Type',
            value: String(row.type ?? ''),
            options: [
              { value: 'Cover page', label: 'Cover page' },
              { value: 'Table of contents', label: 'Table of contents' },
              { value: 'Narrative', label: 'Narrative' },
              { value: 'Technical content', label: 'Technical content' },
            ],
          });
          ui.select({
            label: 'Status',
            value: String(row.status ?? ''),
            options: [
              { value: 'Done', label: 'Done' },
              { value: 'In Process', label: 'In Process' },
            ],
          });
        },
        onReorder: (args) => {
          console.log(args);
          docs = table.getRows() as DocumentRow[];
          ui.notify('Sections reordered', 'success');
        },
        onCellChange: (rowKey, columnKey, value) => {
          docs = docs.map((d) =>
            String(d.id) === String(rowKey) ? { ...d, [columnKey]: value } : d,
          );
          table.setRows(docs);
          ui.notify(`Updated ${columnKey}`, 'success');
        },
        onPrimaryAction: () => {
          docs = [
            {
              id: nextId++,
              header: `New section ${nextId - 1}`,
              type: 'Narrative',
              status: 'In Process',
              target: '10',
              limit: '10',
              reviewer: 'Assign reviewer',
            },
            ...docs,
          ];
          table.setRows(docs);
          ui.notify('Section added', 'success');
        },
        onAction: async (actionId, row) => {
          if (actionId === 'delete') {
            const ok = await ui.confirm(`Delete “${row.header}”?`, {
              confirmVariant: 'destructive',
            });
            if (!ok) return;
            docs = docs.filter((d) => d.id !== row.id);
            table.setRows(docs);
            ui.notify('Deleted', 'success');
            return;
          }
          if (actionId === 'copy') {
            docs = [
              {
                ...(row as DocumentRow),
                id: nextId++,
                header: `${row.header} (copy)`,
              },
              ...docs,
            ];
            table.setRows(docs);
            ui.notify('Copied', 'success');
            return;
          }
          ui.notify(`${actionId}: ${row.header}`, 'info');
        },
      });
    }, { gap: 6 });
});
