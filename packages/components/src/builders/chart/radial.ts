import { Element } from '@badui/core';
import { radialChart } from '../../radial-chart';
import type { ChartSeries } from '../../chart-shared';
import {
  normalizeSeries,
  type ChartChromeOpts,
  type ChromeState,
  type SeriesInput,
} from './shared';

export type RadialRowKeys = {
  name: string;
  value: string;
};

/** Multi-row radial bars → `radialChart` with `nameKey` / `valueKey`. */
export class RadialRowsBuilder {
  private data: Record<string, unknown>[];
  private nameKey: string;
  private valueKey: string;
  private chrome: ChromeState = {};
  private innerRadius?: number | string;
  private outerRadius?: number | string;
  private startAngle?: number;
  private endAngle?: number;

  constructor(data: Record<string, unknown>[], keys: RadialRowKeys) {
    this.data = data;
    this.nameKey = keys.name;
    this.valueKey = keys.value;
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

  radius(inner?: number | string, outer?: number | string): this {
    if (inner !== undefined) this.innerRadius = inner;
    if (outer !== undefined) this.outerRadius = outer;
    return this;
  }

  arc(start?: number, end?: number): this {
    if (start !== undefined) this.startAngle = start;
    if (end !== undefined) this.endAngle = end;
    return this;
  }

  build(): Element {
    return radialChart({
      data: this.data,
      nameKey: this.nameKey,
      valueKey: this.valueKey,
      title: this.chrome.title,
      description: this.chrome.description,
      height: this.chrome.height,
      className: this.chrome.className,
      innerRadius: this.innerRadius,
      outerRadius: this.outerRadius,
      startAngle: this.startAngle,
      endAngle: this.endAngle,
    });
  }
}

export type StackedGaugeOpts = ChartChromeOpts & {
  center?: { value: string | number; label?: string };
  arc?: { start?: number; end?: number };
  radius?: { inner?: number | string; outer?: number | string };
};

/**
 * Gauge recipe: stacked radial series with bundled center text, arc, and radius defaults.
 * Compiles to `radialChart` with `series` over a single row.
 */
export function stackedGauge(
  row: Record<string, unknown>,
  series: SeriesInput,
  gauge: StackedGaugeOpts = {},
): Element {
  const seriesList: ChartSeries[] = normalizeSeries(series);
  return radialChart({
    data: [row],
    series: seriesList,
    title: gauge.title,
    description: gauge.description,
    height: gauge.height,
    className: gauge.className,
    centerValue: gauge.center?.value,
    centerLabel: gauge.center?.label,
    startAngle: gauge.arc?.start,
    endAngle: gauge.arc?.end,
    innerRadius: gauge.radius?.inner,
    outerRadius: gauge.radius?.outer,
  });
}

export const radial = {
  fromRows(data: Record<string, unknown>[], keys: RadialRowKeys): RadialRowsBuilder {
    return new RadialRowsBuilder(data, keys);
  },
  stackedGauge,
};
