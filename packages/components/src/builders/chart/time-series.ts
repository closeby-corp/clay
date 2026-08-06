import { CategoriesChartBuilder } from './categories';

/**
 * Cartesian builder preset for ISO-date x-axis values.
 * Sets `interactive: true` (client 7d / 30d / 90d filter). Call `.x('date')` (or your date field) before `.area()` / `.line()`.
 */
export class TimeSeriesChartBuilder extends CategoriesChartBuilder {
  constructor(data: Record<string, unknown>[]) {
    super(data, { interactive: true });
  }
}

/**
 * ISO-date x-axis + interactive range filter preset.
 * Prefer `.area()` or `.line()`; `.bar()` is available but less common for time series.
 */
export function timeSeries(data: Record<string, unknown>[]): TimeSeriesChartBuilder {
  return new TimeSeriesChartBuilder(data);
}
