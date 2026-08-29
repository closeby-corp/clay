import { ui } from '@close-by/clay';
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

const browserShare = [
  { browser: 'Chrome', visitors: 275 },
  { browser: 'Safari', visitors: 200 },
  { browser: 'Firefox', visitors: 187 },
  { browser: 'Edge', visitors: 173 },
  { browser: 'Other', visitors: 90 },
];

const trafficMix = { mobile: 320, desktop: 480, tablet: 120 };
const trafficSeries = [
  { key: 'mobile', label: 'Mobile', color: 'var(--chart-2)' },
  { key: 'desktop', label: 'Desktop', color: 'var(--chart-1)' },
  { key: 'tablet', label: 'Tablet', color: 'var(--chart-3)' },
];

const monthlySeries = [
  { key: 'mobile', label: 'Mobile', color: 'var(--chart-2)' },
  { key: 'desktop', label: 'Desktop', color: 'var(--chart-1)' },
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
          'ui.chart.categories / timeSeries / pie / radar / radial / scatter / composed — builders preferred; props APIs still available.',
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
        'ui.chart.timeSeries — ISO dates enable client-side period tabs; optional headline metric.',
      );
      ui.chart
        .timeSeries(visitorsSeed as Record<string, unknown>[])
        .x('date')
        .series([
          { key: 'mobile', label: 'Mobile', color: 'var(--chart-2)' },
          { key: 'desktop', label: 'Desktop', color: 'var(--chart-1)' },
        ])
        .area({
          title: 'Total Visitors',
          description: 'Total for the last 3 months',
          headline: { value: '12,450', trend: '+8.2%', trendDirection: 'up' },
        });

      exampleSection(
        'Sparkline KPIs',
        'ui.sparkline — compact metric card with inline area/line mini chart.',
      );
      const sparkRows = (visitorsSeed as Record<string, unknown>[]).slice(-14).map((row) => ({
        date: row.date,
        total: Number(row.mobile ?? 0) + Number(row.desktop ?? 0),
      }));
      ui.row(() => {
        ui.sparkline({
          title: 'Daily visitors',
          value: '1,284',
          trend: '+12.5%',
          trendDirection: 'up',
          data: sparkRows,
          xKey: 'date',
          yKey: 'total',
        });
        ui.sparkline({
          title: 'Bounce rate',
          value: '42%',
          trend: '-4.1%',
          trendDirection: 'down',
          type: 'line',
          data: sparkRows.map((r) => ({ ...r, rate: 50 - Number(r.total) / 40 })),
          xKey: 'date',
          yKey: 'rate',
          color: 'var(--chart-2)',
        });
      }, { gap: 4 }).classes('w-full items-stretch [&>*]:min-w-0 [&>*]:flex-1 [&>*]:basis-0');

      exampleSection('Monthly overview', 'ui.chart.categories → .area(); stacked by default.');
      ui.chart
        .categories(monthly)
        .x('month')
        .series(['mobile', 'desktop'])
        .title('Desktop vs mobile')
        .description('Stacked area by month.')
        .height(240)
        .area();

      exampleSection('Bar chart', 'ui.chart.categories → .bar(); set stacked / layout in the terminal opts.');
      ui.chart
        .categories(monthly)
        .x('month')
        .series(['mobile', 'desktop'])
        .bar({
          title: 'Desktop vs mobile',
          description: 'Grouped columns by month.',
          height: 240,
        });

      ui.chart
        .categories(monthly.slice(0, 4))
        .x('month')
        .series(['mobile', 'desktop'])
        .bar({
          title: 'Stacked horizontal',
          description: 'layout: "horizontal" with stacked series.',
          height: 280,
          layout: 'horizontal',
          stacked: true,
        });

      exampleSection('Line chart', 'Same cartesian builder; interactive date filter via timeSeries.');
      ui.chart
        .categories(monthly)
        .x('month')
        .series(monthlySeries)
        .line({
          title: 'Traffic trend',
          description: 'Monotone lines by month.',
          height: 240,
        });

      exampleSection('Pie / donut', 'ui.chart.pie.fromRows / fromMetrics (donut terminal).');
      ui.row(() => {
        ui.chart.pie
          .fromRows(browserShare, { name: 'browser', value: 'visitors' })
          .title('Browser share')
          .description('Full pie via name / value keys.')
          .height(260)
          .build();

        ui.chart.pie
          .fromMetrics(trafficMix, trafficSeries)
          .title('Traffic mix')
          .description('Donut from series on one row.')
          .height(260)
          .donut(60);
      }, { gap: 4 }).classes('w-full items-stretch [&>*]:min-w-0 [&>*]:flex-1 [&>*]:basis-0');

      exampleSection('Radar chart', 'ui.chart.radar(data, angleKey).series(…).build().');
      ui.chart
        .radar(monthly, 'month')
        .series(monthlySeries)
        .title('Desktop vs mobile')
        .description('Monthly visitors on a radar.')
        .height(280)
        .build();

      exampleSection(
        'Radial chart',
        'ui.chart.radial.fromRows / stackedGauge — rings or a center-labeled gauge.',
      );
      ui.row(() => {
        ui.chart.radial
          .fromRows(browserShare, { name: 'browser', value: 'visitors' })
          .title('Browser share')
          .description('Multi-row radial bars.')
          .height(260)
          .build();

        ui.chart.radial.stackedGauge(trafficMix, trafficSeries, {
          title: 'Traffic mix',
          description: 'Stacked gauge with center label (endAngle: 180).',
          height: 260,
          center: { value: 920, label: 'Visitors' },
          arc: { end: 180 },
          radius: { inner: 80, outer: 110 },
        });
      }, { gap: 4 }).classes('w-full items-stretch [&>*]:min-w-0 [&>*]:flex-1 [&>*]:basis-0');

      exampleSection(
        'Scatter chart',
        'ui.chart.scatter(data).x().y().group?().series?().build().',
      );
      ui.chart
        .scatter([
          { x: 10, y: 30, cohort: 'a' },
          { x: 20, y: 50, cohort: 'a' },
          { x: 35, y: 40, cohort: 'b' },
          { x: 45, y: 70, cohort: 'b' },
          { x: 55, y: 55, cohort: 'a' },
          { x: 70, y: 80, cohort: 'b' },
        ])
        .x('x')
        .y('y')
        .group('cohort')
        .series([
          { key: 'a', label: 'Cohort A', color: 'var(--chart-1)' },
          { key: 'b', label: 'Cohort B', color: 'var(--chart-2)' },
        ])
        .title('Scatter by cohort')
        .description('Points colored by seriesKey / group.')
        .height(280)
        .build();

      exampleSection(
        'Composed chart',
        'ui.chart.composed — mixed geometries, dual Y-axis, reference line/area.',
      );
      const revenueMix = monthly.map((row, index) => ({
        month: row.month,
        revenue: row.desktop * 12,
        margin: 8 + index * 2,
      }));
      ui.chart
        .composed(revenueMix)
        .x('month')
        .bars([{ key: 'revenue', label: 'Revenue', color: 'var(--chart-1)', yAxisId: 'left' }])
        .lines([{ key: 'margin', label: 'Margin %', color: 'var(--chart-2)', yAxisId: 'right' }])
        .title('Revenue vs margin')
        .description('Bars on left axis; line on right with goal reference.')
        .height(280)
        .build({
          referenceLine: { value: 18, label: 'Goal', yAxisId: 'right' },
          referenceArea: { y1: 200, y2: 280, label: 'Forecast band' },
        });

      ui.chart
        .composed(monthly)
        .x('month')
        .bars([{ key: 'mobile', label: 'Mobile', color: 'var(--chart-2)' }])
        .lines([{ key: 'desktop', label: 'Desktop', color: 'var(--chart-1)' }])
        .title('Mobile bars + desktop line')
        .description('Mixed geometries in one Recharts ComposedChart.')
        .height(280)
        .build();

      exampleSection(
        'Live refreshable',
        'Rebuild the chart tree from the server with ui.refreshable.',
      );
      liveChart = ui.refreshable(() => {
        ui.chart
          .categories(liveData)
          .x('month')
          .series(monthlySeries)
          .area({
            title: 'Resampled traffic',
            description: 'Click “Resample monthly” to push new points over WebSocket.',
            height: 220,
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
          ui.chart
            .categories(monthly)
            .x('month')
            .series(['mobile', 'desktop'])
            .height(180)
            .area();
        },
      );

      exampleSection(
        'Props API (legacy)',
        'ui.areaChart / pieChart / … — same Element output as the builders above.',
      );
      ui.areaChart({
        title: 'Desktop vs mobile (props)',
        description: 'Direct areaChart props blob.',
        height: 220,
        data: monthly,
        xKey: 'month',
        series: [
          { key: 'mobile', label: 'Mobile' },
          { key: 'desktop', label: 'Desktop' },
        ],
      });
      ui.pieChart({
        title: 'Browser share (props)',
        description: 'nameKey + valueKey rows.',
        height: 240,
        data: browserShare,
        nameKey: 'browser',
        valueKey: 'visitors',
      });
    }, { gap: 6 });
});
