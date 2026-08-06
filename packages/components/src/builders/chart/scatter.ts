import { scatterChart } from '../../scatter-chart';
import { normalizeSeries, type ChartChromeOpts, type ChromeState, type SeriesInput } from './shared';

export class ScatterBuilder {
  private data: Record<string, unknown>[];
  private xKey = '';
  private yKey = '';
  private seriesKey?: string;
  private seriesInput?: SeriesInput;
  private chrome: ChromeState = {};

  constructor(data: Record<string, unknown>[]) {
    this.data = data;
  }

  x(key: string): this {
    this.xKey = key;
    return this;
  }

  y(key: string): this {
    this.yKey = key;
    return this;
  }

  /** Optional color/group field. */
  group(key: string): this {
    this.seriesKey = key;
    return this;
  }

  series(input: SeriesInput): this {
    this.seriesInput = input;
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

  build(opts: ChartChromeOpts = {}) {
    if (!this.xKey) throw new Error('chart.scatter requires .x() before .build()');
    if (!this.yKey) throw new Error('chart.scatter requires .y() before .build()');
    return scatterChart({
      data: this.data,
      xKey: this.xKey,
      yKey: this.yKey,
      seriesKey: this.seriesKey,
      series: this.seriesInput ? normalizeSeries(this.seriesInput) : undefined,
      title: opts.title ?? this.chrome.title,
      description: opts.description ?? this.chrome.description,
      height: opts.height ?? this.chrome.height,
    });
  }
}

export function scatter(data: Record<string, unknown>[]): ScatterBuilder {
  return new ScatterBuilder(data);
}
