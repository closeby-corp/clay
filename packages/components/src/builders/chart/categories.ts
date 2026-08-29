import { Element } from '@close-by/clay-core';
import { areaChart } from '../../area-chart';
import { barChart } from '../../bar-chart';
import { lineChart } from '../../line-chart';
import type { ChartSeries } from '../../chart-shared';
import {
  applyChrome,
  normalizeSeries,
  type ChartChromeOpts,
  type ChromeState,
  type SeriesInput,
} from './shared';

export type AreaTerminalOpts = ChartChromeOpts & { stacked?: boolean };
export type BarTerminalOpts = ChartChromeOpts & {
  stacked?: boolean;
  layout?: 'vertical' | 'horizontal';
};
export type LineTerminalOpts = ChartChromeOpts;

/**
 * Cartesian charts over row data with a category (or date) x-axis.
 * Call `.x()` and `.series()` before a terminal `.area()` / `.bar()` / `.line()`.
 */
export class CategoriesChartBuilder {
  protected data: Record<string, unknown>[];
  protected xKey?: string;
  protected seriesList?: ChartSeries[];
  protected chrome: ChromeState = {};
  protected interactive?: boolean;

  constructor(data: Record<string, unknown>[], presets?: { interactive?: boolean }) {
    this.data = data;
    if (presets?.interactive === true) {
      this.interactive = true;
    }
  }

  x(key: string): this {
    this.xKey = key;
    return this;
  }

  /** Shorthand `['mobile', 'desktop']` or full `{ key, label, color? }[]`. */
  series(input: SeriesInput): this {
    this.seriesList = normalizeSeries(input);
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

  className(className: string): this {
    this.chrome.className = className;
    return this;
  }

  protected assertReady(): void {
    if (!this.xKey) {
      throw new Error('chart.categories / timeSeries requires .x() before terminal');
    }
    if (!this.seriesList?.length) {
      throw new Error('chart.categories / timeSeries requires .series() before terminal');
    }
  }

  protected baseProps(opts?: ChartChromeOpts) {
    this.assertReady();
    const chrome = applyChrome(this.chrome, opts);
    return {
      data: this.data,
      xKey: this.xKey!,
      series: this.seriesList!,
      title: chrome.title,
      description: chrome.description,
      headline: chrome.headline,
      periods: chrome.periods,
      loading: chrome.loading,
      height: chrome.height,
      className: chrome.className,
      interactive: this.interactive,
    };
  }

  area(opts?: AreaTerminalOpts): Element {
    const { stacked, ...chromeOpts } = opts ?? {};
    return areaChart({
      ...this.baseProps(chromeOpts),
      stacked,
    });
  }

  bar(opts?: BarTerminalOpts): Element {
    const { stacked, layout, ...chromeOpts } = opts ?? {};
    return barChart({
      ...this.baseProps(chromeOpts),
      stacked,
      layout,
    });
  }

  line(opts?: LineTerminalOpts): Element {
    return lineChart(this.baseProps(opts));
  }
}

export function categories(data: Record<string, unknown>[]): CategoriesChartBuilder {
  return new CategoriesChartBuilder(data);
}
