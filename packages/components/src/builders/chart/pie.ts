import { Element } from '@badui/core';
import { pieChart } from '../../pie-chart';
import type { ChartSeries } from '../../chart-shared';
import {
  normalizeSeries,
  type ChromeState,
  type SeriesInput,
} from './shared';

export type PieRowKeys = {
  name: string;
  value: string;
};

abstract class PieBuilderBase {
  protected chrome: ChromeState = {};
  protected innerRadius?: number;

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

  /** Set donut hole radius and build (terminal). */
  donut(innerRadius: number): Element {
    this.innerRadius = innerRadius;
    return this.build();
  }

  abstract build(): Element;
}

/** Many rows with label/value fields → `pieChart` with `nameKey` / `valueKey`. */
export class PieRowsBuilder extends PieBuilderBase {
  private data: Record<string, unknown>[];
  private nameKey: string;
  private valueKey: string;

  constructor(data: Record<string, unknown>[], keys: PieRowKeys) {
    super();
    this.data = data;
    this.nameKey = keys.name;
    this.valueKey = keys.value;
  }

  build(): Element {
    return pieChart({
      data: this.data,
      nameKey: this.nameKey,
      valueKey: this.valueKey,
      title: this.chrome.title,
      description: this.chrome.description,
      height: this.chrome.height,
      className: this.chrome.className,
      innerRadius: this.innerRadius,
    });
  }
}

/** One aggregated row + series keys → `pieChart` with `series`. */
export class PieMetricsBuilder extends PieBuilderBase {
  private data: Record<string, unknown>[];
  private seriesList: ChartSeries[];

  constructor(row: Record<string, unknown>, series: SeriesInput) {
    super();
    this.data = [row];
    this.seriesList = normalizeSeries(series);
  }

  build(): Element {
    return pieChart({
      data: this.data,
      series: this.seriesList,
      title: this.chrome.title,
      description: this.chrome.description,
      height: this.chrome.height,
      className: this.chrome.className,
      innerRadius: this.innerRadius,
    });
  }
}

export const pie = {
  fromRows(data: Record<string, unknown>[], keys: PieRowKeys): PieRowsBuilder {
    return new PieRowsBuilder(data, keys);
  },
  fromMetrics(row: Record<string, unknown>, series: SeriesInput): PieMetricsBuilder {
    return new PieMetricsBuilder(row, series);
  },
};
