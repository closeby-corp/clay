import { categories } from './categories';
import { pie } from './pie';
import { radar } from './radar';
import { radial } from './radial';
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
export {
  normalizeSeries,
  type SeriesInput,
  type ChartChromeOpts,
  type ChromeState,
} from './shared';

/** Mode-first chart namespace: `ui.chart.categories` / `timeSeries` / `pie` / `radial` / `radar`. */
export const chart = {
  categories,
  timeSeries,
  pie,
  radial,
  radar,
};
