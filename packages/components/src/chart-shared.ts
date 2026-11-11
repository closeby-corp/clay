import { Element } from '@close-by/clay-core';

/** Shared series descriptor for cartesian charts (area / bar / line). */
export type ChartSeries = {
  key: string;
  label: string;
  color?: string;
  /** Dual-axis composed charts: `right` uses the secondary Y axis. */
  yAxisId?: 'left' | 'right';
};

/** Headline metric row above a chart (analytics card). */
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

/** Chart element with live data and presentation updates. */
export class ChartElement extends Element {
  /** Replace chart data with a shallow copy. */
  setData(data: Record<string, unknown>[]): this {
    return this.update({ data: [...data] });
  }

  /** Append rows and optionally retain only the latest max rows. */
  appendData(rows: Record<string, unknown> | Record<string, unknown>[], options?: { max?: number }): this {
    const incoming = Array.isArray(rows) ? rows : [rows];
    if (incoming.length === 0) return this;
    const max = options?.max;
    if (max !== undefined && (!Number.isInteger(max) || max < 0)) {
      throw new RangeError('max must be a non-negative integer');
    }
    const data = ((this.props.data as Record<string, unknown>[] | undefined) ?? []).concat(incoming);
    this.props.data = max === undefined ? data : data.slice(Math.max(0, data.length - max));
    if (this.session?.isMounted) {
      this.session.enqueuePatch({
        op: 'appendRows', id: this.id, prop: 'data', rows: incoming,
        ...(max === undefined ? {} : { max }),
      });
    }
    return this;
  }

  /** Replace a row with the same key, or append it when no row matches. */
  upsertData(row: Record<string, unknown>, options?: { key?: string; max?: number }): this {
    const max = options?.max;
    if (max !== undefined && (!Number.isInteger(max) || max < 0)) {
      throw new RangeError('max must be a non-negative integer');
    }
    const defaultKey = this.type === 'piechart' ? this.props.nameKey ?? this.props.xKey : this.props.xKey;
    const key = options?.key ?? (defaultKey as string | undefined) ?? 'x';
    const existing = (this.props.data as Record<string, unknown>[] | undefined) ?? [];
    const index = existing.findIndex((item) => item[key] === row[key]);
    if (index === -1) return this.appendData(row, { max });
    const data = [...existing];
    data[index] = row;
    return this.update({ data: max === undefined ? data : data.slice(Math.max(0, data.length - max)) });
  }

  /** Replace chart series with a shallow copy. */
  setSeries(series: ChartSeries[]): this {
    return this.update({ series: [...series] });
  }

  /** Set or clear the headline metric. */
  setHeadline(headline: ChartHeadline | undefined): this {
    return this.update({ headline: headline ?? null });
  }

  /** Set the chart title. */
  setTitle(title: string): this {
    return this.update({ title });
  }

  /** Set the chart description. */
  setDescription(text: string): this {
    return this.update({ description: text });
  }

  /** Toggle the chart loading state. */
  setLoading(loading: boolean): this {
    return this.update({ loading });
  }
}
