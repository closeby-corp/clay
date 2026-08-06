import { categories } from './categories';
import { composed } from './composed';
import { pie } from './pie';
import { radar } from './radar';
import { radial } from './radial';
import { scatter } from './scatter';
import { timeSeries } from './time-series';

export {
  CategoriesChartBuilder,
  categories,
  type AreaTerminalOpts,
  type BarTerminalOpts,
  type LineTerminalOpts,
} from './categories';
export { TimeSeriesChartBuilder, timeSeries } from './time-series';
export {
  PieRowsBuilder,
  PieMetricsBuilder,
  pie,
  type PieRowKeys,
} from './pie';
export {
  RadialRowsBuilder,
  stackedGauge,
  radial,
  type RadialRowKeys,
  type StackedGaugeOpts,
} from './radial';
export { RadarBuilder, radar } from './radar';
export { ScatterBuilder, scatter } from './scatter';
export { ComposedBuilder, composed, type ComposedTerminalOpts } from './composed';
export {
  normalizeSeries,
  type SeriesInput,
  type ChartChromeOpts,
  type ChromeState,
} from './shared';

/** Mode-first chart namespace: `ui.chart.categories` / `timeSeries` / `pie` / `radial` / `radar` / `scatter` / `composed`. */
export const chart = {
  categories,
  timeSeries,
  pie,
  radial,
  radar,
  scatter,
  composed,
};
