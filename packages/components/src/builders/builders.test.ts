import { describe, expect, test } from 'bun:test';
import {
  areaChart,
  barChart,
  chart,
  column,
  dataTable,
  lineChart,
  pieChart,
  radarChart,
  radialChart,
  table,
} from '../index';

const series = [
  { key: 'mobile', label: 'Mobile' },
  { key: 'desktop', label: 'Desktop' },
];
const data = [{ month: 'Jan', mobile: 10, desktop: 20 }];

describe('chart builders', () => {
  test('categories.area matches areaChart props', () => {
    const legacy = areaChart({ data, xKey: 'month', series });
    const built = chart.categories(data).x('month').series(['mobile', 'desktop']).area();
    expect(built.type).toBe(legacy.type);
    expect(built.props).toMatchObject({
      xKey: 'month',
      series: [
        { key: 'mobile', label: 'mobile' },
        { key: 'desktop', label: 'desktop' },
      ],
      stacked: true,
      interactive: false,
    });

    const withLabels = chart
      .categories(data)
      .x('month')
      .series(series)
      .area({ title: 'Traffic', stacked: true });
    const legacyFull = areaChart({
      data,
      xKey: 'month',
      series,
      title: 'Traffic',
      stacked: true,
    });
    expect(withLabels.type).toBe(legacyFull.type);
    expect(withLabels.props).toMatchObject({
      title: 'Traffic',
      series,
      stacked: true,
    });
  });

  test('categories.bar matches barChart props', () => {
    const legacy = barChart({
      data,
      xKey: 'month',
      series,
      stacked: true,
      layout: 'horizontal',
      title: 'Bars',
    });
    const built = chart
      .categories(data)
      .x('month')
      .series(series)
      .bar({ stacked: true, layout: 'horizontal', title: 'Bars' });
    expect(built.type).toBe(legacy.type);
    expect(built.props).toMatchObject({
      stacked: true,
      layout: 'horizontal',
      title: 'Bars',
      series,
    });
  });

  test('categories.line matches lineChart props', () => {
    const legacy = lineChart({ data, xKey: 'month', series, interactive: true });
    const built = chart.timeSeries(data).x('month').series(series).line();
    expect(built.type).toBe(legacy.type);
    expect(built.props.interactive).toBe(true);
    expect(built.props).toMatchObject({ xKey: 'month', series });
  });

  test('timeSeries sets interactive and requires x/series', () => {
    const el = chart.timeSeries(data).x('date').series(series).area({ title: 'Visitors' });
    expect(el.type).toBe('areachart');
    expect(el.props).toMatchObject({
      interactive: true,
      xKey: 'date',
      title: 'Visitors',
      series,
    });
    expect(() => chart.categories(data).series(series).area()).toThrow(/\.x\(\)/);
    expect(() => chart.categories(data).x('month').area()).toThrow(/\.series\(\)/);
  });

  test('pie.fromRows and fromMetrics match pieChart', () => {
    const rows = [{ name: 'A', value: 1 }];
    const byRowsLegacy = pieChart({ data: rows, nameKey: 'name', valueKey: 'value' });
    const byRows = chart.pie.fromRows(rows, { name: 'name', value: 'value' }).build();
    expect(byRows.type).toBe(byRowsLegacy.type);
    expect(byRows.props).toMatchObject({ nameKey: 'name', valueKey: 'value' });

    const donutLegacy = pieChart({
      data: [{ mobile: 1, desktop: 2 }],
      series,
      innerRadius: 60,
    });
    const donut = chart.pie.fromMetrics({ mobile: 1, desktop: 2 }, series).donut(60);
    expect(donut.type).toBe(donutLegacy.type);
    expect(donut.props.innerRadius).toBe(60);
    expect(donut.props.series).toEqual(series);
  });

  test('radar matches radarChart', () => {
    const legacy = radarChart({
      data,
      angleKey: 'month',
      series,
      title: 'Skills',
      fillOpacity: 0.5,
    });
    const built = chart
      .radar(data, 'month')
      .series(series)
      .title('Skills')
      .opacity(0.5)
      .build();
    expect(built.type).toBe(legacy.type);
    expect(built.props).toMatchObject({
      angleKey: 'month',
      series,
      title: 'Skills',
      fillOpacity: 0.5,
    });
  });

  test('scatter and composed builders', () => {
    const pts = [
      { x: 1, y: 2, g: 'a' },
      { x: 3, y: 4, g: 'b' },
    ];
    const scatterEl = chart.scatter(pts).x('x').y('y').group('g').build();
    expect(scatterEl.type).toBe('scatterchart');
    expect(scatterEl.props).toMatchObject({ xKey: 'x', yKey: 'y', seriesKey: 'g' });

    const composedEl = chart
      .composed(data)
      .x('month')
      .bars(['mobile'])
      .lines(['desktop'])
      .build();
    expect(composedEl.type).toBe('composedchart');
    expect((composedEl.props.series as { type?: string }[]).map((s) => s.type)).toEqual([
      'bar',
      'line',
    ]);
  });

  test('radial.fromRows and stackedGauge match radialChart', () => {
    const rows = [{ browser: 'Chrome', visitors: 275 }];
    const byRowsLegacy = radialChart({
      data: rows,
      nameKey: 'browser',
      valueKey: 'visitors',
    });
    const byRows = chart.radial.fromRows(rows, { name: 'browser', value: 'visitors' }).build();
    expect(byRows.type).toBe(byRowsLegacy.type);
    expect(byRows.props).toMatchObject({ nameKey: 'browser', valueKey: 'visitors' });

    const stackedLegacy = radialChart({
      data: [{ mobile: 320, desktop: 480 }],
      series,
      endAngle: 180,
      centerValue: 800,
      centerLabel: 'Visitors',
    });
    const stacked = chart.radial.stackedGauge(
      { mobile: 320, desktop: 480 },
      series,
      {
        center: { value: 800, label: 'Visitors' },
        arc: { end: 180 },
      },
    );
    expect(stacked.type).toBe(stackedLegacy.type);
    expect(stacked.props).toMatchObject({
      series,
      endAngle: 180,
      centerValue: 800,
      centerLabel: 'Visitors',
    });
  });

  test('builders attach to parent layout', () => {
    const root = column(() => {
      chart.categories(data).x('month').series(series).area();
      table([{ id: 1, name: 'a' }]).id('id').columns([{ key: 'name', header: 'Name' }]).build();
    });
    expect(root.children).toHaveLength(2);
    expect(root.children[0]!.type).toBe('areachart');
    expect(root.children[1]!.type).toBe('datatable');
  });
});

describe('table builder', () => {
  const rows = [
    { id: 1, title: 'One', status: 'todo' },
    { id: 2, title: 'Two', status: 'done' },
  ];
  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'status', header: 'Status' },
  ];
  const actions = [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete', variant: 'destructive' as const },
  ];
  const onAction = () => {};

  test('search/groupBy/rowActions compile equivalent props', () => {
    const legacy = dataTable(rows, {
      keyField: 'id',
      columns,
      searchable: true,
      searchPlaceholder: 'Search tasks…',
      groupBy: 'status',
      pageSize: 8,
      pageSizeOptions: [5, 8, 10, 20],
      actions,
      onAction,
    });
    const built = table(rows)
      .id('id')
      .columns(columns)
      .search('Search tasks…')
      .groupBy('status')
      .pageSize(8, { options: [5, 8, 10, 20] })
      .rowActions(actions, onAction)
      .build();

    expect(built.type).toBe(legacy.type);
    expect(built.props).toMatchObject({
      keyField: 'id',
      searchable: true,
      searchPlaceholder: 'Search tasks…',
      groupBy: 'status',
      pageSize: 8,
      pageSizeOptions: [5, 8, 10, 20],
      actions: actions.map(({ id, label, variant }) => ({ id, label, variant, icon: undefined })),
    });
    expect(legacy.props).toMatchObject({
      keyField: 'id',
      searchable: true,
      searchPlaceholder: 'Search tasks…',
      groupBy: 'status',
      pageSize: 8,
    });
  });

  test('views validates defaultId', () => {
    expect(() =>
      table(rows)
        .views([{ id: 'all', label: 'All' }], 'missing')
        .build(),
    ).toThrow(/defaultId/);
  });

  test('rowActions rejects empty actions', () => {
    expect(() => table(rows).rowActions([], onAction).build()).toThrow(/non-empty/);
  });

  test('selectable/reorderable/export/detail wire flags', () => {
    const detail = () => {};
    const onSelectionChange = () => {};
    const onReorder = () => {};
    const built = table(rows)
      .selectable(onSelectionChange)
      .reorderable(onReorder)
      .export('tasks')
      .detail(detail)
      .build();
    expect(built.props).toMatchObject({
      selectable: true,
      reorderable: true,
      exportable: true,
      hasDetail: true,
    });
  });

  test('primaryAction and bulkActions compile', async () => {
    const primaryCalls: number[] = [];
    const bulkCalls: Array<{ actionId: string; rowKeys: Array<string | number> }> = [];
    const built = table(rows)
      .id('id')
      .columns(columns)
      .primaryAction('Add', () => {
        primaryCalls.push(1);
      })
      .bulkActions([{ id: 'archive', label: 'Archive' }], (actionId, rowKeys) => {
        bulkCalls.push({ actionId, rowKeys });
      })
      .build();

    expect(built.props).toMatchObject({
      primaryAction: { label: 'Add' },
      selectable: true,
      bulkActions: [{ id: 'archive', label: 'Archive', icon: undefined, variant: undefined }],
    });
    expect((built.props.events as string[]).includes('primaryAction')).toBe(true);
    expect((built.props.events as string[]).includes('bulkAction')).toBe(true);

    await built.handleEvent('primaryAction');
    expect(primaryCalls).toEqual([1]);
    await built.handleEvent('bulkAction', { actionId: 'archive', rowKeys: [1, 2] });
    expect(bulkCalls).toEqual([{ actionId: 'archive', rowKeys: [1, 2] }]);
  });

  test('bulkActions rejects empty actions', () => {
    expect(() =>
      table(rows)
        .bulkActions([], () => {})
        .build(),
    ).toThrow(/non-empty/);
  });

  test('manualPagination density zebra compile', () => {
    const built = table(rows)
      .id('id')
      .columns(columns)
      .pageSize(5)
      .manualPagination(100)
      .manualFiltering()
      .manualSorting()
      .density('compact')
      .zebra()
      .build();
    expect(built.props).toMatchObject({
      manualPagination: true,
      manualFiltering: true,
      manualSorting: true,
      totalRows: 100,
      density: 'compact',
      zebra: true,
      pageSize: 5,
    });
  });
});
