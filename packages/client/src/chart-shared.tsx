import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export type ChartSeries = { key: string; label: string; color?: string };
export type TimeRange = '90d' | '30d' | '7d';

export function isIsoDate(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);
}

export function buildSeriesConfig(series: ChartSeries[]): ChartConfig {
  const config: ChartConfig = {};
  for (const [index, s] of series.entries()) {
    config[s.key] = {
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
    config[name] = {
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
): { filteredData: Record<string, unknown>[]; timeRange: TimeRange; setTimeRange: (v: TimeRange) => void } {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');

  useEffect(() => {
    if (interactive && isMobile) setTimeRange('7d');
  }, [interactive, isMobile]);

  const filteredData = useMemo(() => {
    if (!interactive) return data;
    const dated = data.filter((row) => isIsoDate(row[xKey]));
    if (dated.length === 0) return data;
    const reference = new Date(String(dated[dated.length - 1]![xKey]));
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const start = new Date(reference);
    start.setDate(start.getDate() - days);
    return dated.filter((row) => new Date(String(row[xKey])) >= start);
  }, [data, interactive, timeRange, xKey]);

  return { filteredData, timeRange, setTimeRange };
}

export function ChartChrome({
  title,
  description,
  interactive,
  timeRange,
  setTimeRange,
  className,
  propsClassName,
  style,
  children,
}: {
  title: string;
  description: string;
  interactive: boolean;
  timeRange?: TimeRange;
  setTimeRange?: (v: TimeRange) => void;
  className?: string;
  propsClassName?: string;
  style: unknown;
  children: ReactNode;
}) {
  const styleProp =
    typeof style === 'object' && style ? (style as CSSProperties) : undefined;

  if (!title && !interactive) {
    return (
      <div className={cn(className, propsClassName)} style={styleProp}>
        {children}
      </div>
    );
  }

  return (
    <Card
      className={cn('@container/card', className, propsClassName)}
      style={styleProp}
    >
      <CardHeader>
        {title ? <CardTitle>{title}</CardTitle> : null}
        {description ? <CardDescription>{description}</CardDescription> : null}
        {interactive && timeRange && setTimeRange ? (
          <CardAction>
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={(value) => {
                if (value === '7d' || value === '30d' || value === '90d') setTimeRange(value);
              }}
              variant="outline"
              className="hidden @[767px]/card:flex"
            >
              <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
              <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
              <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
            </ToggleGroup>
            <Select
              value={timeRange}
              onValueChange={(value) => {
                if (value === '7d' || value === '30d' || value === '90d') setTimeRange(value);
              }}
            >
              <SelectTrigger
                className="flex w-40 @[767px]/card:hidden"
                aria-label="Select a value"
                size="sm"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">{children}</CardContent>
    </Card>
  );
}

export function parseCartesianProps(props: Record<string, unknown>) {
  const data = (props.data as Record<string, unknown>[]) ?? [];
  const xKey = String(props.xKey ?? 'x');
  const series = (props.series as ChartSeries[]) ?? [];
  const title = props.title ? String(props.title) : '';
  const description = props.description ? String(props.description) : '';
  const interactive = props.interactive === true;
  const height = Number(props.height ?? (interactive ? 250 : 220));
  return { data, xKey, series, title, description, interactive, height };
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
