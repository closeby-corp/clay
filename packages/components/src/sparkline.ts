import { Element } from '@close-by/clay-core';
import type { ChartHeadline } from './chart-shared';

export type SparklineProps = {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  /** Mini chart geometry. Default `area`. */
  type?: 'area' | 'line';
  title?: string;
  description?: string;
  /** Headline metric; shorthand for `{ value, trend, trendDirection }`. */
  headline?: ChartHeadline;
  value?: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down';
  /** Chart color CSS (default `var(--chart-1)`). */
  color?: string;
  height?: number;
  className?: string;
};

/** Compact KPI card with an inline area/line sparkline. */
export function sparkline(props: SparklineProps): Element {
  const headline: ChartHeadline | undefined =
    props.headline ??
    (props.value != null
      ? {
          value: props.value,
          trend: props.trend,
          trendDirection: props.trendDirection,
        }
      : undefined);

  return new Element('sparkline', {
    data: props.data,
    xKey: props.xKey,
    yKey: props.yKey,
    type: props.type ?? 'area',
    title: props.title,
    description: props.description,
    headline,
    color: props.color,
    height: props.height ?? 48,
    className: props.className,
  });
}
