import { expect, test } from 'bun:test';
import { Children, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Area } from 'recharts';
import { BoundAreaChart } from './BoundAreaChart';
import { ChartChrome } from './chart-shared';
import visitors from '../../../apps/demo/src/examples/dashboard-visitors.json';

test('area charts with shared series keys keep gradients and colors local to each chart', () => {
  const charts: ReactElement<any>[] = [];
  function Probe({ explicitColors }: { explicitColors: boolean }) {
    // Inspect the element tree because Recharts does not render SVG during SSR.
    charts.push(BoundAreaChart({
      props: {
        data: [{ month: 'Jan', mobile: 20, desktop: 40 }],
        xKey: 'month',
        series: ['mobile', 'desktop'].map((key, index) => ({
          key,
          label: key,
          ...(explicitColors ? { color: `var(--chart-${2 - index})` } : {}),
        })),
      },
      style: undefined,
    }));
    return null;
  }

  renderToStaticMarkup(<><Probe explicitColors /><Probe explicitColors={false} /></>);

  const ids: string[] = [];
  for (const [chartIndex, chrome] of charts.entries()) {
    const container = chrome.props.children;
    const children = Children.toArray(container.props.children.props.children) as ReactElement<any>[];
    const gradients = Children.toArray(children[0]!.props.children) as ReactElement<any>[];
    const areas = children.filter((child) => child.type === Area);
    expect(areas).toHaveLength(2);
    for (const [index, area] of areas.entries()) {
      const key = area.props.dataKey;
      const gradient = gradients[index]!;
      ids.push(gradient.props.id);
      expect(area.props.fill).toBe(`url(#${gradient.props.id})`);
      expect(area.props.stroke).toBe(`var(--color-${key})`);
      for (const stop of Children.toArray(gradient.props.children) as ReactElement<any>[]) {
        expect(stop.props.stopColor).toBe(area.props.stroke);
      }
      expect(container.props.config[key].color).toBe(
        `var(--chart-${chartIndex === 0 ? 2 - index : index + 1})`,
      );
    }
  }
  expect(new Set(ids).size).toBe(4);
});


test('interactive areas paint historical fixtures immediately for default and seven-day ranges', () => {
  for (const periods of [undefined, [{ value: '7d', label: 'Last 7 days', days: 7 }]]) {
    let chart: ReactElement<any> | undefined;
    function Probe() {
      chart = BoundAreaChart({
        props: {
          interactive: true,
          data: visitors,
          xKey: 'date',
          periods,
          series: [{ key: 'desktop', label: 'Desktop' }],
        },
        style: undefined,
      });
      return null;
    }
    renderToStaticMarkup(<Probe />);
    const chrome = chart!;
    expect(chrome.props.period).toBe(periods ? '7d' : '90d');
    const areaChart = chrome.props.children.props.children;
    expect(areaChart.props.data.length).toBe(periods ? 8 : visitors.length);
    expect(areaChart.props.data.at(-1)).toEqual(visitors.at(-1));
    const areas = (Children.toArray(areaChart.props.children) as ReactElement<any>[])
      .filter((child) => child.type === Area);
    expect(areas[0]!.props.isAnimationActive).toBe(false);
  }
});

test('interactive chart subtitle follows the selected period and preserves explicit descriptions', () => {
  for (const [period, expected] of [['90d', 'Total for the last 3 months'], ['30d', 'Total for the last 30 days'], ['7d', 'Total for the last 7 days']]) {
    const markup = renderToStaticMarkup(
      <ChartChrome title="Visitors" description="" interactive period={period} style={undefined}>
        <div />
      </ChartChrome>,
    );
    expect(markup).toContain(expected!);
  }
  expect(renderToStaticMarkup(
    <ChartChrome title="Visitors" description="Custom description" interactive period="7d" style={undefined}>
      <div />
    </ChartChrome>,
  )).toContain('Custom description');
});
