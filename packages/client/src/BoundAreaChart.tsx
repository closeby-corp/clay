import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  ChartChrome,
  cssSafeKey,
  formatAxisTick,
  formatTooltipLabel,
  isIsoDate,
  parseCartesianProps,
  useInteractiveChartData,
  useLiveChartAnimation,
  useSeriesConfig,
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
    showLegend,
  } = parseCartesianProps(props);
  const stacked = props.stacked !== false;
  const gradientId = `area-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { filteredData, period, setPeriod, periods: periodDefs } = useInteractiveChartData(
    data,
    xKey,
    interactive,
    periods,
  );
  const config = useSeriesConfig(series);
  const anim = useLiveChartAnimation(filteredData, xKey, props.animate);

  const chart = (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <AreaChart accessibilityLayer data={filteredData} margin={{ left: 12, right: 12 }}>
        <defs>
          {series.map((s) => {
            const key = cssSafeKey(s.key);
            return (
              <linearGradient key={key} id={`${gradientId}-${key}`} x1="0" y1="0" x2="0" y2="1">
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
        {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
        {series.map((s) => {
          const key = cssSafeKey(s.key);
          return (
            <Area
              key={key}
              dataKey={s.key}
              type="natural"
              // Interactive ranges must paint immediately while the responsive width settles.
              isAnimationActive={interactive ? false : anim}
              animationDuration={400}
              fill={`url(#${gradientId}-${key})`}
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
