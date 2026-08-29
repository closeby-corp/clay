import { composedChart, type ComposedChartSeries, type ComposedSeriesType } from '../../composed-chart';
import type { ChartReferenceArea, ChartReferenceLine } from '../../chart-shared';
import {
  normalizeSeries,
  type ChartChromeOpts,
  type ChromeState,
  type SeriesInput,
} from './shared';

export type ComposedTerminalOpts = ChartChromeOpts & {
  stacked?: boolean;
  referenceLine?: ChartReferenceLine;
  referenceArea?: ChartReferenceArea;
};

type SeriesWithType = ComposedChartSeries;

function withTypes(
  series: ReturnType<typeof normalizeSeries>,
  type: ComposedSeriesType,
): SeriesWithType[] {
  return series.map((s) => ({ ...s, type }));
}

export class ComposedBuilder {
  private data: Record<string, unknown>[];
  private xKey = '';
  private seriesList: SeriesWithType[] = [];
  private chrome: ChromeState = {};

  constructor(data: Record<string, unknown>[]) {
    this.data = data;
  }

  x(key: string): this {
    this.xKey = key;
    return this;
  }

  /** Append series rendered as bars. */
  bars(input: SeriesInput): this {
    this.seriesList.push(...withTypes(normalizeSeries(input), 'bar'));
    return this;
  }

  /** Append series rendered as lines. */
  lines(input: SeriesInput): this {
    this.seriesList.push(...withTypes(normalizeSeries(input), 'line'));
    return this;
  }

  /** Append series rendered as areas. */
  areas(input: SeriesInput): this {
    this.seriesList.push(...withTypes(normalizeSeries(input), 'area'));
    return this;
  }

  title(title: string): this {
    this.chrome.title = title;
    return this;
  }

  description(description: string): this {
    this.chrome.description = description;
    return this;
  }

  height(height: number): this {
    this.chrome.height = height;
    return this;
  }

  build(opts: ComposedTerminalOpts = {}) {
    if (!this.xKey) throw new Error('chart.composed requires .x() before .build()');
    if (this.seriesList.length === 0) {
      throw new Error('chart.composed requires .bars() / .lines() / .areas() before .build()');
    }
    return composedChart({
      data: this.data,
      xKey: this.xKey,
      series: this.seriesList,
      stacked: opts.stacked === true,
      title: opts.title ?? this.chrome.title,
      description: opts.description ?? this.chrome.description,
      headline: opts.headline ?? this.chrome.headline,
      periods: opts.periods ?? this.chrome.periods,
      loading: opts.loading ?? this.chrome.loading,
      height: opts.height ?? this.chrome.height,
      referenceLine: opts.referenceLine,
      referenceArea: opts.referenceArea,
    });
  }
}

export function composed(data: Record<string, unknown>[]): ComposedBuilder {
  return new ComposedBuilder(data);
}
