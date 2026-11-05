import { ChartElement } from './chart-shared';
import type { CartesianChartProps, ChartSeries } from './chart-shared';

export type AreaChartSeries = ChartSeries;

export type AreaChartProps = CartesianChartProps & {
  /** Stack series (default true). */
  stacked?: boolean;
};

export function areaChart(props: AreaChartProps): ChartElement {
  return new ChartElement('areachart', {
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
    stacked: props.stacked !== false,
    showLegend: props.showLegend !== false,
  });
}
