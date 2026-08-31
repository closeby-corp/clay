import { Element } from '@close-by/clay-core';
import type {
  CartesianChartProps,
  ChartReferenceArea,
  ChartReferenceLine,
  ChartSeries,
  LineChartStyleProps,
} from './chart-shared';

export type ComposedSeriesType = 'bar' | 'line' | 'area';

export type ComposedChartSeries = ChartSeries & {
  /** Geometry for this series in the composed chart (default `bar`). */
  type?: ComposedSeriesType;
};

export type ComposedChartProps = CartesianChartProps &
  LineChartStyleProps & {
    series: ComposedChartSeries[];
    stacked?: boolean;
    referenceLine?: ChartReferenceLine;
    referenceArea?: ChartReferenceArea;
  };

export function composedChart(props: ComposedChartProps): Element {
  return new Element('composedchart', {
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
    stacked: props.stacked === true,
    referenceLine: props.referenceLine,
    referenceArea: props.referenceArea,
    curve: props.curve,
    strokeWidth: props.strokeWidth,
    dots: props.dots === true,
    strokeDasharray:
      props.strokeDasharray ??
      (props.dashed === true ? '4 4' : typeof props.dashed === 'string' ? props.dashed : undefined),
    variant: props.variant === 'minimal' ? 'minimal' : 'default',
  });
}
