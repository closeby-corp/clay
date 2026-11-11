import { expect, test } from 'bun:test';
import { Children, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Area } from 'recharts';
import { BoundAreaChart } from './BoundAreaChart';

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
