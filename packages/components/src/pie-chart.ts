import { Element } from '@clay/core';
import type { ChartSeries } from './chart-shared';

export type PieChartSeries = ChartSeries;

export type PieChartProps = {
  data: Record<string, unknown>[];
  /** Field for slice labels (required when not using series over one row). */
  nameKey?: string;
  /** Field for slice values (required when not using series over one row). */
  valueKey?: string;
  /**
   * Alternative to nameKey/valueKey: series keys over a single aggregated row
   * (or the first row). Each series key becomes a slice.
   */
  series?: PieChartSeries[];
  className?: string;
  title?: string;
  description?: string;
  /** Chart height in px. Default 250. */
  height?: number;
  /** Inner radius for donut (e.g. 60). Omit / 0 for a full pie. */
  innerRadius?: number;
};

export function pieChart(props: PieChartProps): Element {
  return new Element('piechart', {
    data: props.data,
    nameKey: props.nameKey,
    valueKey: props.valueKey,
    series: props.series,
    className: props.className,
    title: props.title,
    description: props.description,
    height: props.height,
    innerRadius: props.innerRadius,
  });
}
