import { Element } from '@clay/core';
import type { ChartSeries } from './chart-shared';

export type ScatterChartSeries = ChartSeries;

export type ScatterChartProps = {
  data: Record<string, unknown>[];
  /** Field for X values (numbers). */
  xKey: string;
  /** Field for Y values (numbers). */
  yKey: string;
  /**
   * Optional series / color grouping field. When set, points are colored by
   * distinct values of this field (or by explicit `series` keys).
   */
  seriesKey?: string;
  series?: ScatterChartSeries[];
  className?: string;
  title?: string;
  description?: string;
  height?: number;
};

export function scatterChart(props: ScatterChartProps): Element {
  return new Element('scatterchart', {
    data: props.data,
    xKey: props.xKey,
    yKey: props.yKey,
    seriesKey: props.seriesKey,
    series: props.series,
    className: props.className,
    title: props.title,
    description: props.description,
    height: props.height,
  });
}
