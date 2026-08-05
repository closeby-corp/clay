import { Element } from '@badui/core';
import type { CartesianChartProps, ChartSeries } from './chart-shared';

export type LineChartSeries = ChartSeries;

export type LineChartProps = CartesianChartProps;

export function lineChart(props: LineChartProps): Element {
  return new Element('linechart', {
    data: props.data,
    xKey: props.xKey,
    series: props.series,
    className: props.className,
    title: props.title,
    description: props.description,
    interactive: props.interactive === true,
    height: props.height,
  });
}
