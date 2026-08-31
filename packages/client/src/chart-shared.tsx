import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type ChartConfig } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export type ChartSeries = {
  key: string;
  label: string;
  color?: string;
  yAxisId?: 'left' | 'right';
};

export type ChartHeadline = {
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down';
};

export type ChartPeriodDef = {
  value: string;
  label: string;
  days?: number;
};

export type ChartReferenceLine = {
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

const DEFAULT_PERIODS: ChartPeriodDef[] = [
  { value: '90d', label: 'Last 3 months', days: 90 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '7d', label: 'Last 7 days', days: 7 },
];

export type LineCurve =
  | 'monotone'
  | 'linear'
  | 'natural'
  | 'step'
  | 'stepBefore'
  | 'stepAfter'
  | 'basis';

const LINE_CURVES = new Set<LineCurve>([
  'monotone',
  'linear',
  'natural',
  'step',
  'stepBefore',
  'stepAfter',
  'basis',
]);

export type ParsedLineStyle = {
  curve: LineCurve;
  strokeWidth: number;
  dots: boolean;
  strokeDasharray?: string;
  variant: 'default' | 'minimal';
};

/** Resolve legend visibility; preserves smart defaults when `showLegend` is omitted. */
export function resolveShowLegend(
  props: Record<string, unknown>,
  autoShow = true,
): boolean {
  if (props.showLegend === false) return false;
  if (props.showLegend === true) return true;
  return autoShow;
}

export function parseLineStyle(props: Record<string, unknown>): ParsedLineStyle {
  const curveRaw = props.curve;
  const curve =
    typeof curveRaw === 'string' && LINE_CURVES.has(curveRaw as LineCurve)
      ? (curveRaw as LineCurve)
      : 'monotone';
  const strokeWidth = typeof props.strokeWidth === 'number' ? props.strokeWidth : 2;
  const dots = props.dots === true;
  const strokeDasharray =
    props.strokeDasharray != null
      ? String(props.strokeDasharray)
      : props.dashed === true
        ? '4 4'
        : typeof props.dashed === 'string'
          ? props.dashed
          : undefined;
  const variant = props.variant === 'minimal' ? 'minimal' : 'default';
  return { curve, strokeWidth, dots, strokeDasharray, variant };
}

/** CSS custom-property–safe key for ChartStyle `--color-${key}`. */
export function cssSafeKey(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'slice';
}

export function isIsoDate(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);
}

export function buildSeriesConfig(series: ChartSeries[]): ChartConfig {
  const config: ChartConfig = {};
  for (const [index, s] of series.entries()) {
    config[cssSafeKey(s.key)] = {
      label: s.label,
      color: s.color ?? `var(--chart-${index + 1})`,
    };
  }
  return config;
}

/** Build ChartConfig for pie slices from data rows (nameKey / valueKey). */
export function buildPieConfig(
  data: Record<string, unknown>[],
  nameKey: string,
  series?: ChartSeries[],
): ChartConfig {
  if (series && series.length > 0) {
    return buildSeriesConfig(series);
  }
  const config: ChartConfig = {};
  for (const [index, row] of data.entries()) {
    const name = String(row[nameKey] ?? `slice-${index}`);
    const key = cssSafeKey(name);
    config[key] = {
      label: name,
      color: `var(--chart-${(index % 5) + 1})`,
    };
  }
  return config;
}

export function useInteractiveChartData(
  data: Record<string, unknown>[],
  xKey: string,
  interactive: boolean,
  periods?: ChartPeriodDef[],
): {
  filteredData: Record<string, unknown>[];
  period: string;
  setPeriod: (v: string) => void;
  periods: ChartPeriodDef[];
} {
  const periodDefs = periods?.length ? periods : DEFAULT_PERIODS;
  const defaultPeriod = periodDefs[0]?.value ?? '90d';
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState(defaultPeriod);

  useEffect(() => {
    if (interactive && isMobile) {
      const mobileDefault = periodDefs.find((p) => p.value === '7d') ?? periodDefs[periodDefs.length - 1];
      if (mobileDefault) setPeriod(mobileDefault.value);
    }
  }, [interactive, isMobile, periodDefs]);

  const filteredData = useMemo(() => {
    if (!interactive) return data;
    const dated = data.filter((row) => isIsoDate(row[xKey]));
    if (dated.length === 0) return data;
    const reference = new Date(String(dated[dated.length - 1]![xKey]));
    const days =
      periodDefs.find((p) => p.value === period)?.days ??
      (period === '7d' ? 7 : period === '30d' ? 30 : 90);
    const start = new Date(reference);
    start.setDate(start.getDate() - days);
    return dated.filter((row) => new Date(String(row[xKey])) >= start);
  }, [data, interactive, period, periodDefs, xKey]);

  return { filteredData, period, setPeriod, periods: periodDefs };
}

function ChartHeadlineRow({ headline }: { headline: ChartHeadline }) {
  const trendVariant =
    headline.trendDirection === 'up'
      ? 'green'
      : headline.trendDirection === 'down'
        ? 'red'
        : undefined;

  return (
    <div className="flex flex-wrap items-baseline gap-2 pt-1">
      <span className="text-3xl font-semibold tabular-nums tracking-tight">
        {headline.value}
      </span>
      {headline.trend ? (
        <Badge variant="outline" color={trendVariant} className="font-normal">
          {headline.trend}
        </Badge>
      ) : null}
    </div>
  );
}

export function ChartChrome({
  title,
  description,
  headline,
  interactive,
  period,
  setPeriod,
  periods,
  loading,
  className,
  propsClassName,
  style,
  children,
}: {
  title: string;
  description: string;
  headline?: ChartHeadline;
  interactive: boolean;
  period?: string;
  setPeriod?: (v: string) => void;
  periods?: ChartPeriodDef[];
  loading?: boolean;
  className?: string;
  propsClassName?: string;
  style: unknown;
  children: ReactNode;
}) {
  const styleProp =
    typeof style === 'object' && style ? (style as CSSProperties) : undefined;
  const periodDefs = periods?.length ? periods : DEFAULT_PERIODS;
  const showChrome = Boolean(title || description || headline || interactive);

  if (!showChrome) {
    return (
      <div className={cn('w-full min-w-0', className, propsClassName)} style={styleProp}>
        {loading ? <Skeleton className="h-[220px] w-full rounded-xl" /> : children}
      </div>
    );
  }

  return (
    <Card
      className={cn('w-full min-w-0 @container/card', className, propsClassName)}
      style={styleProp}
    >
      <CardHeader>
        {title ? <CardTitle>{title}</CardTitle> : null}
        {description ? <CardDescription>{description}</CardDescription> : null}
        {headline ? <ChartHeadlineRow headline={headline} /> : null}
        {interactive && period && setPeriod ? (
          <CardAction>
            <ToggleGroup
              type="single"
              value={period}
              onValueChange={(value) => {
                if (value) setPeriod(value);
              }}
              variant="outline"
              className="hidden @[767px]/card:flex"
            >
              {periodDefs.map((p) => (
                <ToggleGroupItem key={p.value} value={p.value}>
                  {p.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger
                className="flex w-40 @[767px]/card:hidden"
                aria-label="Select a period"
                size="sm"
              >
                <SelectValue placeholder={periodDefs[0]?.label ?? 'Period'} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {periodDefs.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="rounded-lg">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? <Skeleton className="h-[220px] w-full rounded-xl" /> : children}
      </CardContent>
    </Card>
  );
}

function parseHeadline(raw: unknown): ChartHeadline | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const h = raw as Record<string, unknown>;
  if (h.value == null) return undefined;
  return {
    value: h.value as string | number,
    trend: h.trend != null ? String(h.trend) : undefined,
    trendDirection:
      h.trendDirection === 'up' || h.trendDirection === 'down'
        ? h.trendDirection
        : undefined,
  };
}

function parsePeriods(raw: unknown): ChartPeriodDef[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((item) => {
    const p = item as Record<string, unknown>;
    return {
      value: String(p.value ?? ''),
      label: String(p.label ?? p.value ?? ''),
      days: p.days != null ? Number(p.days) : undefined,
    };
  });
}

export function parseCartesianProps(props: Record<string, unknown>) {
  const data = (props.data as Record<string, unknown>[]) ?? [];
  const xKey = String(props.xKey ?? 'x');
  const series = (props.series as ChartSeries[]) ?? [];
  const title = props.title ? String(props.title) : '';
  const description = props.description ? String(props.description) : '';
  const headline = parseHeadline(props.headline);
  const periods = parsePeriods(props.periods);
  const loading = props.loading === true;
  const interactive = props.interactive === true;
  const height = Number(props.height ?? (interactive ? 250 : 220));
  const showLegend = resolveShowLegend(props);
  return {
    data,
    xKey,
    series,
    title,
    description,
    headline,
    periods,
    loading,
    interactive,
    height,
    showLegend,
  };
}

export function parseReferenceLine(raw: unknown): ChartReferenceLine | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (r.value == null) return undefined;
  return {
    value: r.value as number | string,
    label: r.label != null ? String(r.label) : undefined,
    axis: r.axis === 'x' ? 'x' : 'y',
    yAxisId: r.yAxisId === 'right' ? 'right' : 'left',
    stroke: r.stroke != null ? String(r.stroke) : undefined,
    strokeDasharray: r.strokeDasharray != null ? String(r.strokeDasharray) : undefined,
  };
}

export function parseReferenceArea(raw: unknown): ChartReferenceArea | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  return {
    y1: r.y1 != null ? Number(r.y1) : undefined,
    y2: r.y2 != null ? Number(r.y2) : undefined,
    x1: r.x1 as number | string | undefined,
    x2: r.x2 as number | string | undefined,
    label: r.label != null ? String(r.label) : undefined,
    yAxisId: r.yAxisId === 'right' ? 'right' : 'left',
    fill: r.fill != null ? String(r.fill) : undefined,
    fillOpacity: r.fillOpacity != null ? Number(r.fillOpacity) : undefined,
  };
}

export function formatAxisTick(value: unknown): string {
  if (isIsoDate(value)) {
    return new Date(String(value)).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
  return String(value).slice(0, 3);
}

export function formatTooltipLabel(value: unknown): string {
  if (isIsoDate(value)) {
    return new Date(String(value)).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
  return String(value);
}
