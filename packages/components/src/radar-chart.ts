import { Element } from '@close-by/clay-core';
import type { ChartSeries } from './chart-shared';

export type RadarChartSeries = ChartSeries;

export type RadarChartProps = {
  data: Record<string, unknown>[];
  /** Field for polar angle labels (categories). */
  angleKey: string;
  series: RadarChartSeries[];
  className?: string;
  title?: string;
  description?: string;
  /** Chart height in px. Default 250. */
  height?: number;
  /** Fill opacity for radar polygons (0–1). Default 0.6. */
  fillOpacity?: number;
};

export function radarChart(props: RadarChartProps): Element {
  return new Element('radarchart', {
    data: props.data,
    angleKey: props.angleKey,
    series: props.series,
    className: props.className,
    title: props.title,
    description: props.description,
    height: props.height,
    fillOpacity: props.fillOpacity,
  });
}
