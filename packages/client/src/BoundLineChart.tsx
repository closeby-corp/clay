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
  cssSafeKey,
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
  const {
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
  } = parseCartesianProps(props);
  const { filteredData, period, setPeriod, periods: periodDefs } = useInteractiveChartData(
    data,
    xKey,
    interactive,
    periods,
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
        {series.map((s) => {
          const key = cssSafeKey(s.key);
          return (
            <Line
              key={key}
              dataKey={s.key}
              type="monotone"
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              dot={false}
            />
          );
        })}
      </LineChart>
    </ChartContainer>
  );

  return (
    <ChartChrome
      title={title}
      description={description}
      headline={headline}
      interactive={interactive}
      period={period}
      setPeriod={setPeriod}
      periods={periodDefs}
      loading={loading}
      className={className}
      propsClassName={props.className as string | undefined}
      style={style}
    >
      {chart}
    </ChartChrome>
  );
}
