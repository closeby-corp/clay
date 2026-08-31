import { Element } from '@close-by/clay-core';
import type { CartesianChartProps, ChartSeries, LineChartStyleProps } from './chart-shared';

export type LineChartSeries = ChartSeries;

export type LineChartProps = CartesianChartProps & LineChartStyleProps;

function wireLineStyle(props: LineChartStyleProps) {
  return {
    curve: props.curve,
    strokeWidth: props.strokeWidth,
    dots: props.dots === true,
    strokeDasharray:
      props.strokeDasharray ??
      (props.dashed === true ? '4 4' : typeof props.dashed === 'string' ? props.dashed : undefined),
    variant: props.variant === 'minimal' ? 'minimal' : 'default',
  };
}

export function lineChart(props: LineChartProps): Element {
  return new Element('linechart', {
    data: props.data,
    xKey: props.xKey,
    series: props.series,
    className: props.className,
    title: props.title,
    description: props.description,
    headline: props.headline,
    periods: props.periods,
    loading: props.loading === true,
    interactive: props.interactive === true,
    height: props.height,
    showLegend: props.showLegend !== false,
    ...wireLineStyle(props),
  });
}
