import { Element } from '@badui/core';

export type AreaChartSeries = {
  key: string;
  label: string;
  color?: string;
};

export type AreaChartProps = {
  data: Record<string, unknown>[];
  xKey: string;
  series: AreaChartSeries[];
  className?: string;
  title?: string;
  description?: string;
  /** Client-side 7d / 30d / 90d filter when `xKey` values are ISO dates. */
  interactive?: boolean;
  /** Chart height in px. Default 220 (250 when interactive). */
  height?: number;
};

export function areaChart(props: AreaChartProps): Element {
  return new Element('areachart', {
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
