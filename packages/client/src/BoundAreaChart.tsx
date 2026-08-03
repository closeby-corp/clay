import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
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

type Series = { key: string; label: string; color?: string };
type TimeRange = '90d' | '30d' | '7d';

function isIsoDate(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);
}

export function BoundAreaChart({
  props,
  className,
  style,
}: {
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
}) {
  const data = (props.data as Record<string, unknown>[]) ?? [];
  const xKey = String(props.xKey ?? 'x');
  const series = (props.series as Series[]) ?? [];
  const title = props.title ? String(props.title) : '';
  const description = props.description ? String(props.description) : '';
  const interactive = props.interactive === true;
  const height = Number(props.height ?? (interactive ? 250 : 220));
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

  const config: ChartConfig = {
    visitors: { label: 'Visitors' },
  };
  for (const [index, s] of series.entries()) {
    config[s.key] = {
      label: s.label,
      color: s.color ?? `var(--chart-${index + 1})`,
    };
  }

  const chart = (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <AreaChart accessibilityLayer data={filteredData} margin={{ left: 12, right: 12 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`var(--color-${s.key})`} stopOpacity={0.8} />
              <stop offset="95%" stopColor={`var(--color-${s.key})`} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          hide={!interactive && filteredData.every((row) => !isIsoDate(row[xKey]))}
          tickFormatter={(value) => {
            if (isIsoDate(value)) {
              return new Date(String(value)).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
            }
            return String(value).slice(0, 3);
          }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(value) =>
                isIsoDate(value)
                  ? new Date(String(value)).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : String(value)
              }
            />
          }
        />
        {series.map((s) => (
          <Area
            key={s.key}
            dataKey={s.key}
            type="natural"
            fill={`url(#fill-${s.key})`}
            stroke={`var(--color-${s.key})`}
            stackId="a"
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );

  if (!title && !interactive) {
    return (
      <div
        className={cn(className, props.className as string | undefined)}
        style={typeof style === 'object' && style ? (style as CSSProperties) : undefined}
      >
        {chart}
      </div>
    );
  }

  return (
    <Card
      className={cn('@container/card', className, props.className as string | undefined)}
      style={typeof style === 'object' && style ? (style as CSSProperties) : undefined}
    >
      <CardHeader>
        {title ? <CardTitle>{title}</CardTitle> : null}
        {description ? <CardDescription>{description}</CardDescription> : null}
        {interactive ? (
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
              <SelectTrigger className="flex w-40 @[767px]/card:hidden" aria-label="Select a value" size="sm">
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
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">{chart}</CardContent>
    </Card>
  );
}
