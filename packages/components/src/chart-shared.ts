/** Shared series descriptor for cartesian charts (area / bar / line). */
export type ChartSeries = {
  key: string;
  label: string;
  color?: string;
  /** Dual-axis composed charts: `right` uses the secondary Y axis. */
  yAxisId?: 'left' | 'right';
};

/** Headline metric row above a chart (ReUI-style analytics card). */
export type ChartHeadline = {
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down';
};

/** Custom period tab for interactive time-series charts. */
export type ChartPeriod = {
  value: string;
  label: string;
  /** Days of history from the last data point (default 90 when interactive uses built-ins). */
  days?: number;
};

export type ChartReferenceLine = {
  /** Y value for horizontal reference, or category/x value when `axis` is `x`. */
  value: number | string;
  label?: string;
  axis?: 'x' | 'y';
  yAxisId?: 'left' | 'right';
  stroke?: string;
  strokeDasharray?: string;
};

export type ChartReferenceArea = {
  y1?: number;
  y2?: number;
  x1?: number | string;
  x2?: number | string;
  label?: string;
  yAxisId?: 'left' | 'right';
  fill?: string;
  fillOpacity?: number;
};

/** Recharts line interpolation modes exposed on `ui.lineChart`. */
export type LineCurve =
  | 'monotone'
  | 'linear'
  | 'natural'
  | 'step'
  | 'stepBefore'
  | 'stepAfter'
  | 'basis';

/** Line chart visual preset. `minimal` drops the grid for a cleaner sparkline-like plot. */
export type LineChartVariant = 'default' | 'minimal';

/** Line geometry and stroke styling (also applies to line series in `ui.composedChart`). */
export type LineChartStyleProps = {
  /** Curve interpolation (default `monotone`). */
  curve?: LineCurve;
  /** Stroke width in px (default 2). */
  strokeWidth?: number;
  /** Show point markers on the line (default false). */
  dots?: boolean;
  /** Dashed stroke pattern, e.g. `'4 4'`. Shorthand: `dashed: true` → `'4 4'`. */
  strokeDasharray?: string;
  dashed?: boolean | string;
  /** `minimal` hides the grid; default keeps full cartesian chrome. */
  variant?: LineChartVariant;
};

/** Common props for area / bar / line charts. */
export type CartesianChartProps = {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  className?: string;
  title?: string;
  description?: string;
  /** Large metric + optional trend chip in the card header. */
  headline?: ChartHeadline;
  /** Replace default 7d/30d/90d tabs when `interactive` is true. */
  periods?: ChartPeriod[];
  /** Show skeleton placeholder instead of the chart. */
  loading?: boolean;
  /** Client-side period filter when `xKey` values are ISO dates. */
  interactive?: boolean;
  /** Chart height in px. Default 220 (250 when interactive). */
  height?: number;
  /** Show series legend (default true). Set `false` to hide. */
  showLegend?: boolean;
};
