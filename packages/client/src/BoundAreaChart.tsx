import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  buildSeriesConfig,
  ChartChrome,
  cssSafeKey,
  formatAxisTick,
  formatTooltipLabel,
  isIsoDate,
  parseCartesianProps,
  useInteractiveChartData,
} from './chart-shared';

export function BoundAreaChart({
  props,
  className,
  style,
}: {
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
}) {
  const { data, xKey, series, title, description, interactive, height } =
    parseCartesianProps(props);
  const stacked = props.stacked !== false;
  const { filteredData, timeRange, setTimeRange } = useInteractiveChartData(
    data,
    xKey,
    interactive,
  );
  const config = buildSeriesConfig(series);

  const chart = (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <AreaChart accessibilityLayer data={filteredData} margin={{ left: 12, right: 12 }}>
        <defs>
          {series.map((s) => {
            const key = cssSafeKey(s.key);
            return (
              <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.8} />
                <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.1} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          hide={!interactive && filteredData.every((row) => !isIsoDate(row[xKey]))}
          tickFormatter={formatAxisTick}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={formatTooltipLabel}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map((s) => {
          const key = cssSafeKey(s.key);
          return (
            <Area
              key={key}
              dataKey={s.key}
              type="natural"
              fill={`url(#fill-${key})`}
              stroke={`var(--color-${key})`}
              stackId={stacked ? 'a' : undefined}
            />
          );
        })}
      </AreaChart>
    </ChartContainer>
  );

  return (
    <ChartChrome
      title={title}
      description={description}
      interactive={interactive}
      timeRange={timeRange}
      setTimeRange={setTimeRange}
      className={className}
      propsClassName={props.className as string | undefined}
      style={style}
    >
      {chart}
    </ChartChrome>
  );
}
