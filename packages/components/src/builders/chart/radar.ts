import { Element } from '@close-by/clay-core';
import { radarChart } from '../../radar-chart';
import type { ChartSeries } from '../../chart-shared';
import {
  normalizeSeries,
  type ChromeState,
  type SeriesInput,
} from './shared';

/** Polar categories via `angleKey` → `radarChart`. */
export class RadarBuilder {
  private data: Record<string, unknown>[];
  private angleKey: string;
  private seriesList?: ChartSeries[];
  private chrome: ChromeState = {};
  private fillOpacity?: number;

  constructor(data: Record<string, unknown>[], angleKey: string) {
    this.data = data;
    this.angleKey = angleKey;
  }

  /** Shorthand string keys or full series descriptors. */
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

  opacity(fillOpacity: number): this {
    this.fillOpacity = fillOpacity;
    return this;
  }

  build(): Element {
    if (!this.seriesList?.length) {
      throw new Error('chart.radar requires .series() before .build()');
    }
    return radarChart({
      data: this.data,
      angleKey: this.angleKey,
      series: this.seriesList,
      title: this.chrome.title,
      description: this.chrome.description,
      height: this.chrome.height,
      className: this.chrome.className,
      fillOpacity: this.fillOpacity,
    });
  }
}

export function radar(data: Record<string, unknown>[], angleKey: string): RadarBuilder {
  return new RadarBuilder(data, angleKey);
}
