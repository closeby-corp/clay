import { Element } from '@close-by/clay-core';
import type { CartesianChartProps, ChartSeries } from './chart-shared';

export type BarChartSeries = ChartSeries;

export type BarChartProps = CartesianChartProps & {
  /** Stack series (default false). */
  stacked?: boolean;
  /** `vertical` = category on X (default); `horizontal` = category on Y. */
  layout?: 'vertical' | 'horizontal';
};

export function barChart(props: BarChartProps): Element {
  return new Element('barchart', {
    data: props.data,
    xKey: props.xKey,
    series: props.series,
    className: props.className,
    title: props.title,
    description: props.description,
    interactive: props.interactive === true,
    height: props.height,
    stacked: props.stacked === true,
    layout: props.layout === 'horizontal' ? 'horizontal' : 'vertical',
  });
}
