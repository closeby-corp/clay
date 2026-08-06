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
          'ui.areaChart / barChart / lineChart / pieChart / radarChart / radialChart — card chrome, legends, and live refresh.',
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
        'ISO dates enable client-side 7d / 30d / 90d filtering on area charts.',
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

      exampleSection('Monthly overview', 'Card chrome with title and description; stacked by default.');
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

      exampleSection('Bar chart', 'Grouped bars; set stacked: true or layout: "horizontal".');
      ui.barChart({
        title: 'Desktop vs mobile',
        description: 'Grouped columns by month.',
        height: 240,
        data: monthly,
        xKey: 'month',
        series: [
          { key: 'mobile', label: 'Mobile' },
          { key: 'desktop', label: 'Desktop' },
        ],
      });

      ui.barChart({
        title: 'Stacked horizontal',
        description: 'layout: "horizontal" with stacked series.',
        height: 280,
        layout: 'horizontal',
        stacked: true,
        data: monthly.slice(0, 4),
        xKey: 'month',
        series: [
          { key: 'mobile', label: 'Mobile' },
          { key: 'desktop', label: 'Desktop' },
        ],
      });

      exampleSection('Line chart', 'Same cartesian props as area; interactive date filter supported.');
      ui.lineChart({
        title: 'Traffic trend',
        description: 'Monotone lines by month.',
        height: 240,
        data: monthly,
        xKey: 'month',
        series: [
          { key: 'mobile', label: 'Mobile', color: 'var(--chart-2)' },
          { key: 'desktop', label: 'Desktop', color: 'var(--chart-1)' },
        ],
      });

      exampleSection('Pie / donut', 'nameKey + valueKey rows, or series over one aggregated row.');
      ui.row(() => {
        ui.pieChart({
          title: 'Browser share',
          description: 'Full pie via nameKey / valueKey.',
          height: 260,
          data: [
            { browser: 'Chrome', visitors: 275 },
            { browser: 'Safari', visitors: 200 },
            { browser: 'Firefox', visitors: 187 },
            { browser: 'Edge', visitors: 173 },
            { browser: 'Other', visitors: 90 },
          ],
          nameKey: 'browser',
          valueKey: 'visitors',
        });
        ui.pieChart({
          title: 'Traffic mix',
          description: 'Donut from series on one row (innerRadius).',
          height: 260,
          innerRadius: 60,
          data: [{ mobile: 320, desktop: 480, tablet: 120 }],
          series: [
            { key: 'mobile', label: 'Mobile', color: 'var(--chart-2)' },
            { key: 'desktop', label: 'Desktop', color: 'var(--chart-1)' },
            { key: 'tablet', label: 'Tablet', color: 'var(--chart-3)' },
          ],
        });
      }, { gap: 4 }).classes('w-full items-stretch [&>*]:min-w-0 [&>*]:flex-1 [&>*]:basis-0');

      exampleSection(
        'Radar chart',
        'Polar series with angleKey categories — ShadCN radar parity.',
      );
      ui.radarChart({
        title: 'Desktop vs mobile',
        description: 'Monthly visitors on a radar.',
        height: 280,
        data: monthly,
        angleKey: 'month',
        series: [
          { key: 'mobile', label: 'Mobile', color: 'var(--chart-2)' },
          { key: 'desktop', label: 'Desktop', color: 'var(--chart-1)' },
        ],
      });

      exampleSection(
        'Radial chart',
        'nameKey/valueKey rings, or stacked series with optional center text.',
      );
      ui.row(() => {
        ui.radialChart({
          title: 'Browser share',
          description: 'Multi-row radial bars.',
          height: 260,
          data: [
            { browser: 'Chrome', visitors: 275 },
            { browser: 'Safari', visitors: 200 },
            { browser: 'Firefox', visitors: 187 },
            { browser: 'Edge', visitors: 173 },
            { browser: 'Other', visitors: 90 },
          ],
          nameKey: 'browser',
          valueKey: 'visitors',
        });
        ui.radialChart({
          title: 'Traffic mix',
          description: 'Stacked gauge with center label (endAngle: 180).',
          height: 260,
          endAngle: 180,
          innerRadius: 80,
          outerRadius: 110,
          centerValue: 920,
          centerLabel: 'Visitors',
          data: [{ mobile: 320, desktop: 480, tablet: 120 }],
          series: [
            { key: 'mobile', label: 'Mobile', color: 'var(--chart-2)' },
            { key: 'desktop', label: 'Desktop', color: 'var(--chart-1)' },
            { key: 'tablet', label: 'Tablet', color: 'var(--chart-3)' },
          ],
        });
      }, { gap: 4 }).classes('w-full items-stretch [&>*]:min-w-0 [&>*]:flex-1 [&>*]:basis-0');

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
