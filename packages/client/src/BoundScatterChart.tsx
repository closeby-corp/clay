import { Scatter, ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  buildSeriesConfig,
  ChartChrome,
  cssSafeKey,
  resolveShowLegend,
  type ChartSeries,
} from './chart-shared';

export function BoundScatterChart({
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
  const yKey = String(props.yKey ?? 'y');
  const seriesKey = props.seriesKey ? String(props.seriesKey) : undefined;
  const series = (props.series as ChartSeries[] | undefined) ?? [];
  const title = props.title ? String(props.title) : '';
  const description = props.description ? String(props.description) : '';
  const height = Number(props.height ?? 250);

  let config: ChartConfig;
  let groups: Array<{ key: string; label: string; rows: Record<string, unknown>[] }>;

  if (seriesKey) {
    const keys = [...new Set(data.map((row) => String(row[seriesKey] ?? 'default')))];
    const seriesByKey = new Map(series.map((s) => [s.key, s]));
    groups = keys.map((key) => ({
      key,
      label: seriesByKey.get(key)?.label ?? key,
      rows: data.filter((row) => String(row[seriesKey] ?? 'default') === key),
    }));
    config = buildSeriesConfig(
      groups.map((g) => seriesByKey.get(g.key) ?? { key: g.key, label: g.label }),
    );
  } else if (series.length > 0) {
    groups = series.map((s) => ({
      key: s.key,
      label: s.label,
      rows: data,
    }));
    config = buildSeriesConfig(series);
  } else {
    groups = [{ key: 'points', label: 'Points', rows: data }];
    config = { points: { label: 'Points', color: 'var(--chart-1)' } };
  }

  const showLegend = resolveShowLegend(props, groups.length > 1);

  const chart = (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <ScatterChart margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid />
        <XAxis type="number" dataKey={xKey} name={xKey} tickLine={false} axisLine={false} />
        <YAxis type="number" dataKey={yKey} name={yKey} tickLine={false} axisLine={false} />
        <ZAxis range={[60, 60]} />
        <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent />} />
        {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
        {groups.map((g) => {
          const key = cssSafeKey(g.key);
          return (
            <Scatter
              key={key}
              name={g.label}
              data={g.rows}
              fill={`var(--color-${key})`}
            />
          );
        })}
      </ScatterChart>
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
