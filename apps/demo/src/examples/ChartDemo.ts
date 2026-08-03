import { ui } from '@badui/ui';
import { exampleHeader, exampleSection } from '../chrome';
import visitorsSeed from './dashboard-visitors.json';

export const pageMeta = {
  label: 'Charts',
  icon: 'chart-area',
  order: 90,
};

const monthly = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

function jitterSeries(): Record<string, unknown>[] {
  return monthly.map((row) => ({
    month: row.month,
    desktop: Math.max(20, row.desktop + Math.floor(Math.random() * 80) - 40),
    mobile: Math.max(20, row.mobile + Math.floor(Math.random() * 60) - 30),
  }));
}

ui.page('/examples/charts', () => {
    let liveData = jitterSeries();
    let liveChart: ReturnType<typeof ui.refreshable>;

    ui.column(() => {
      ui.row(() => {
        exampleHeader(
          undefined,
          'ui.areaChart — title/description card chrome, interactive date ranges, and live refresh.',
        );
        ui.button('Resample monthly', {
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            liveData = jitterSeries();
            liveChart.refresh();
            ui.notify('Chart data updated', 'success');
          },
        });
      }, { gap: 4 }).classes('items-start justify-between');

      exampleSection(
        'Interactive visitors',
        'ISO dates enable client-side 7d / 30d / 90d filtering.',
      );
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

      exampleSection('Monthly overview', 'Card chrome with title and description; no range filter.');
      ui.areaChart({
        title: 'Desktop vs mobile',
        description: 'Stacked area by month.',
        height: 240,
        data: monthly,
        xKey: 'month',
        series: [
          { key: 'mobile', label: 'Mobile' },
          { key: 'desktop', label: 'Desktop' },
        ],
      });

      exampleSection(
        'Live refreshable',
        'Rebuild the chart tree from the server with ui.refreshable.',
      );
      liveChart = ui.refreshable(() => {
        ui.areaChart({
          title: 'Resampled traffic',
          description: 'Click “Resample monthly” to push new points over WebSocket.',
          height: 220,
          data: liveData,
          xKey: 'month',
          series: [
            { key: 'mobile', label: 'Mobile', color: 'var(--chart-2)' },
            { key: 'desktop', label: 'Desktop', color: 'var(--chart-1)' },
          ],
        });
      });

      exampleSection('Bare chart', 'Omit title/description for a plain sparkline-style chart.');
      ui.card(
        {
          title: 'Embedded',
          description: 'Useful inside drawers or custom cards.',
          gap: 4,
        },
        () => {
          ui.areaChart({
            height: 180,
            data: monthly,
            xKey: 'month',
            series: [
              { key: 'mobile', label: 'Mobile' },
              { key: 'desktop', label: 'Desktop' },
            ],
          });
        },
      );
    }, { gap: 6 });
});
