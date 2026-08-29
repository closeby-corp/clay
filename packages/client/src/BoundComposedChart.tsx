import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
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
  parseReferenceArea,
  parseReferenceLine,
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
  const {
    data,
    xKey,
    series: rawSeries,
    title,
    description,
    headline,
    periods,
    loading,
    interactive,
    height,
  } = parseCartesianProps(props);
  const series = rawSeries as ComposedSeries[];
  const stacked = props.stacked === true;
  const referenceLine = parseReferenceLine(props.referenceLine);
  const referenceArea = parseReferenceArea(props.referenceArea);
  const hasRightAxis = series.some((s) => s.yAxisId === 'right');
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
      <ComposedChart accessibilityLayer data={filteredData} margin={{ left: 12, right: hasRightAxis ? 24 : 12 }}>
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
        <YAxis
          yAxisId="left"
          orientation="left"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={40}
        />
        {hasRightAxis ? (
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={40}
          />
        ) : null}
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent labelFormatter={formatTooltipLabel} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {referenceArea ? (
          <ReferenceArea
            yAxisId={referenceArea.yAxisId ?? 'left'}
            y1={referenceArea.y1}
            y2={referenceArea.y2}
            x1={referenceArea.x1}
            x2={referenceArea.x2}
            fill={referenceArea.fill ?? 'var(--chart-3)'}
            fillOpacity={referenceArea.fillOpacity ?? 0.12}
            label={referenceArea.label}
          />
        ) : null}
        {referenceLine ? (
          <ReferenceLine
            yAxisId={referenceLine.yAxisId ?? 'left'}
            x={referenceLine.axis === 'x' ? referenceLine.value : undefined}
            y={referenceLine.axis !== 'x' ? referenceLine.value : undefined}
            stroke={referenceLine.stroke ?? 'var(--muted-foreground)'}
            strokeDasharray={referenceLine.strokeDasharray ?? '4 4'}
            label={referenceLine.label}
          />
        ) : null}
        {series.map((s) => {
          const key = cssSafeKey(s.key);
          const type = s.type ?? 'bar';
          const yAxisId = s.yAxisId ?? 'left';
          if (type === 'line') {
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={s.key}
                yAxisId={yAxisId}
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
                yAxisId={yAxisId}
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
              yAxisId={yAxisId}
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
