import { Area, Bar, CartesianGrid, ComposedChart, Line, XAxis } from 'recharts';
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
  type ChartSeries,
} from './chart-shared';

type ComposedSeries = ChartSeries & { type?: 'bar' | 'line' | 'area' };

export function BoundComposedChart({
  props,
  className,
  style,
}: {
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
}) {
  const { data, xKey, series: rawSeries, title, description, interactive, height } =
    parseCartesianProps(props);
  const series = rawSeries as ComposedSeries[];
  const stacked = props.stacked === true;
  const { filteredData, timeRange, setTimeRange } = useInteractiveChartData(
    data,
    xKey,
    interactive,
  );
  const config = buildSeriesConfig(series);
  const hideCategoryTicks =
    !interactive && filteredData.every((row) => !isIsoDate(row[xKey]));

  const chart = (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <ComposedChart accessibilityLayer data={filteredData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          hide={hideCategoryTicks}
          tickFormatter={formatAxisTick}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent labelFormatter={formatTooltipLabel} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map((s) => {
          const key = cssSafeKey(s.key);
          const type = s.type ?? 'bar';
          if (type === 'line') {
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={s.key}
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={false}
              />
            );
          }
          if (type === 'area') {
            return (
              <Area
                key={key}
                type="monotone"
                dataKey={s.key}
                fill={`var(--color-${key})`}
                stroke={`var(--color-${key})`}
                fillOpacity={0.3}
                stackId={stacked ? 'a' : undefined}
              />
            );
          }
          return (
            <Bar
              key={key}
              dataKey={s.key}
              fill={`var(--color-${key})`}
              radius={4}
              stackId={stacked ? 'a' : undefined}
            />
          );
        })}
      </ComposedChart>
    </ChartContainer>
  );

  return (
    <ChartChrome
      title={title}
      description={description}
      interactive={interactive}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      className={className}
      propsClassName={props.className as string | undefined}
      style={style}
    >
      {chart}
    </ChartChrome>
  );
}
