import { Cell, Pie, PieChart } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  buildPieConfig,
  buildSeriesConfig,
  ChartChrome,
  type ChartSeries,
} from './chart-shared';

function expandSeriesData(
  data: Record<string, unknown>[],
  series: ChartSeries[],
): { rows: Record<string, unknown>[]; nameKey: string; valueKey: string; config: ChartConfig } {
  const row = data[0] ?? {};
  const rows = series.map((s) => ({
    name: s.key,
    value: Number(row[s.key] ?? 0),
  }));
  return {
    rows,
    nameKey: 'name',
    valueKey: 'value',
    config: buildSeriesConfig(series),
  };
}

export function BoundPieChart({
  props,
  className,
  style,
}: {
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
}) {
  const data = (props.data as Record<string, unknown>[]) ?? [];
  const series = (props.series as ChartSeries[] | undefined) ?? undefined;
  const title = props.title ? String(props.title) : '';
  const description = props.description ? String(props.description) : '';
  const height = Number(props.height ?? 250);
  const innerRadius = Number(props.innerRadius ?? 0);

  let rows: Record<string, unknown>[];
  let nameKey: string;
  let valueKey: string;
  let config: ChartConfig;

  if (series && series.length > 0) {
    const expanded = expandSeriesData(data, series);
    rows = expanded.rows;
    nameKey = expanded.nameKey;
    valueKey = expanded.valueKey;
    config = expanded.config;
  } else {
    nameKey = String(props.nameKey ?? 'name');
    valueKey = String(props.valueKey ?? 'value');
    rows = data.map((row, index) => {
      const name = String(row[nameKey] ?? `slice-${index}`);
      return { ...row, [nameKey]: name };
    });
    config = buildPieConfig(rows, nameKey);
  }

  const chart = (
    <ChartContainer config={config} className="aspect-auto mx-auto w-full" style={{ height }}>
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey={nameKey} />} />
        <Pie
          data={rows}
          dataKey={valueKey}
          nameKey={nameKey}
          innerRadius={innerRadius > 0 ? innerRadius : undefined}
          strokeWidth={2}
        >
          {rows.map((row, index) => {
            const name = String(row[nameKey] ?? index);
            return <Cell key={name} fill={`var(--color-${name})`} />;
          })}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey={nameKey} />}
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
        />
      </PieChart>
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
