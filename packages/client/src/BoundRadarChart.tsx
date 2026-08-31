import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';
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
  resolveShowLegend,
  type ChartSeries,
} from './chart-shared';

export function BoundRadarChart({
  props,
  className,
  style,
}: {
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
}) {
  const data = (props.data as Record<string, unknown>[]) ?? [];
  const angleKey = String(props.angleKey ?? 'category');
  const series = (props.series as ChartSeries[]) ?? [];
  const title = props.title ? String(props.title) : '';
  const description = props.description ? String(props.description) : '';
  const height = Number(props.height ?? 250);
  const fillOpacity =
    typeof props.fillOpacity === 'number' ? props.fillOpacity : 0.6;
  const config = buildSeriesConfig(series);
  const showLegend = resolveShowLegend(props, series.length > 1);

  const chart = (
    <ChartContainer
      config={config}
      className="mx-auto aspect-square w-full"
      style={{ height }}
    >
      <RadarChart
        data={data}
        margin={
          showLegend
            ? { top: -20, bottom: 0, left: 0, right: 0 }
            : { top: 0, bottom: 0, left: 0, right: 0 }
        }
      >
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarAngleAxis dataKey={angleKey} />
        <PolarGrid />
        {series.map((s) => {
          const key = cssSafeKey(s.key);
          return (
            <Radar
              key={key}
              dataKey={s.key}
              fill={`var(--color-${key})`}
              fillOpacity={fillOpacity}
            />
          );
        })}
        {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
      </RadarChart>
    </ChartContainer>
  );

  return (
    <ChartChrome
      title={title}
      description={description}
      interactive={false}
      className={className}
      propsClassName={props.className as string | undefined}
      style={style}
    >
      {chart}
    </ChartChrome>
  );
}
