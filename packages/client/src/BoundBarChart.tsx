import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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

export function BoundBarChart({
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
  const stacked = props.stacked === true;
  const layout = props.layout === 'horizontal' ? 'horizontal' : 'vertical';
  const { filteredData, period, setPeriod, periods: periodDefs } = useInteractiveChartData(
    data,
    xKey,
    interactive,
    periods,
  );
  const config = buildSeriesConfig(series);
  const hideCategoryTicks =
    !interactive && filteredData.every((row) => !isIsoDate(row[xKey]));

  const chart = (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <BarChart
        accessibilityLayer
        data={filteredData}
        layout={layout === 'horizontal' ? 'vertical' : 'horizontal'}
        margin={{ left: 12, right: 12 }}
      >
        <CartesianGrid vertical={layout !== 'horizontal'} horizontal={layout === 'horizontal'} />
        {layout === 'horizontal' ? (
          <>
            <YAxis
              dataKey={xKey}
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={80}
              tickFormatter={formatAxisTick}
            />
            <XAxis type="number" hide />
          </>
        ) : (
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            hide={hideCategoryTicks}
            tickFormatter={formatAxisTick}
          />
        )}
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent labelFormatter={formatTooltipLabel} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map((s) => {
          const key = cssSafeKey(s.key);
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
      </BarChart>
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
