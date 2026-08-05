import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
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
  formatAxisTick,
  formatTooltipLabel,
  isIsoDate,
  parseCartesianProps,
  useInteractiveChartData,
} from './chart-shared';

export function BoundLineChart({
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
  const { filteredData, timeRange, setTimeRange } = useInteractiveChartData(
    data,
    xKey,
    interactive,
  );
  const config = buildSeriesConfig(series);

  const chart = (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <LineChart accessibilityLayer data={filteredData} margin={{ left: 12, right: 12 }}>
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
          content={<ChartTooltipContent labelFormatter={formatTooltipLabel} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map((s) => (
          <Line
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stroke={`var(--color-${s.key})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
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
