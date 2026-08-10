import { Element } from '@clay/core';
import type { CartesianChartProps, ChartSeries } from './chart-shared';

export type ComposedSeriesType = 'bar' | 'line' | 'area';

export type ComposedChartSeries = ChartSeries & {
  /** Geometry for this series in the composed chart (default `bar`). */
  type?: ComposedSeriesType;
};

export type ComposedChartProps = CartesianChartProps & {
  series: ComposedChartSeries[];
  stacked?: boolean;
};

export function composedChart(props: ComposedChartProps): Element {
  return new Element('composedchart', {
    data: props.data,
    xKey: props.xKey,
    series: props.series,
    className: props.className,
    title: props.title,
    description: props.description,
    interactive: props.interactive === true,
    height: props.height,
    stacked: props.stacked === true,
  });
}
