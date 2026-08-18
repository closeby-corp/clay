import { Element } from '@close-by/clay-core';
import type { ChartSeries } from './chart-shared';

export type RadialChartSeries = ChartSeries;

export type RadialChartProps = {
  data: Record<string, unknown>[];
  /** Field for ring labels (required when not using series over one row). */
  nameKey?: string;
  /** Field for ring values (required when not using series over one row). */
  valueKey?: string;
  /**
   * Alternative to nameKey/valueKey: series keys over a single aggregated row
   * (or the first row). Each series key becomes a stacked radial segment.
   */
  series?: RadialChartSeries[];
  className?: string;
  title?: string;
  description?: string;
  /** Chart height in px. Default 250. */
  height?: number;
  /** Inner radius (px or %). Default 30 for multi-row, 80 for series. */
  innerRadius?: number | string;
  /** Outer radius (px or %). Default 110. */
  outerRadius?: number | string;
  /** Start angle in degrees. Default 0. */
  startAngle?: number;
  /** End angle in degrees. Default 360 (full circle); use ~180 for a gauge. */
  endAngle?: number;
  /** Optional center headline (radial-text / stacked patterns). */
  centerValue?: string | number;
  /** Optional center sublabel under `centerValue`. */
  centerLabel?: string;
};

export function radialChart(props: RadialChartProps): Element {
  return new Element('radialchart', {
    data: props.data,
    nameKey: props.nameKey,
    valueKey: props.valueKey,
    series: props.series,
    className: props.className,
    title: props.title,
    description: props.description,
    height: props.height,
    innerRadius: props.innerRadius,
    outerRadius: props.outerRadius,
    startAngle: props.startAngle,
    endAngle: props.endAngle,
    centerValue: props.centerValue,
    centerLabel: props.centerLabel,
  });
}
