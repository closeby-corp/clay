/** Shared series descriptor for cartesian charts (area / bar / line). */
export type ChartSeries = {
  key: string;
  label: string;
  color?: string;
};

/** Common props for area / bar / line charts. */
export type CartesianChartProps = {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  className?: string;
  title?: string;
  description?: string;
  /** Client-side 7d / 30d / 90d filter when `xKey` values are ISO dates. */
  interactive?: boolean;
  /** Chart height in px. Default 220 (250 when interactive). */
  height?: number;
};
