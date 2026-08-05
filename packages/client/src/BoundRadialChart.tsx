import type { ReactNode } from 'react';
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';
import {
  ChartContainer,
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

function CenterLabel({
  centerValue,
  centerLabel,
}: {
  centerValue?: string;
  centerLabel?: string;
}) {
  if (centerValue == null && !centerLabel) return null;
  return (
    <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
      <Label
        content={({ viewBox }) => {
          if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null;
          const cx = viewBox.cx ?? 0;
          const cy = viewBox.cy ?? 0;
          return (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
              {centerValue != null ? (
                <tspan x={cx} y={cy} className="fill-foreground text-4xl font-bold">
                  {centerValue}
                </tspan>
              ) : null}
              {centerLabel ? (
                <tspan
                  x={cx}
                  y={cy + (centerValue != null ? 24 : 0)}
                  className="fill-muted-foreground"
                >
                  {centerLabel}
                </tspan>
              ) : null}
            </text>
          );
        }}
      />
    </PolarRadiusAxis>
  );
}

export function BoundRadialChart({
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
  const startAngle = typeof props.startAngle === 'number' ? props.startAngle : 0;
  const endAngle = typeof props.endAngle === 'number' ? props.endAngle : 360;
  const centerValue =
    props.centerValue != null && props.centerValue !== ''
      ? String(props.centerValue)
      : undefined;
  const centerLabel = props.centerLabel ? String(props.centerLabel) : undefined;
  const useSeries = Boolean(series && series.length > 0);
  const outerRadius: number | string =
    typeof props.outerRadius === 'number' || typeof props.outerRadius === 'string'
      ? props.outerRadius
      : 110;
  const innerRadius: number | string =
    typeof props.innerRadius === 'number' || typeof props.innerRadius === 'string'
      ? props.innerRadius
      : useSeries
        ? 80
        : 30;

  let chart: ReactNode;

  if (useSeries && series) {
    const row = data[0] ?? {};
    const stacked: Record<string, unknown> = {};
    for (const s of series) {
      stacked[s.key] = Number(row[s.key] ?? 0);
    }
    const config = buildSeriesConfig(series);

    chart = (
      <ChartContainer
        config={config}
        className="mx-auto aspect-square w-full max-w-[250px]"
        style={{ height }}
      >
        <RadialBarChart
          data={[stacked]}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
        >
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            className="first:fill-muted last:fill-background"
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          {series.map((s) => (
            <RadialBar
              key={s.key}
              dataKey={s.key}
              stackId="a"
              cornerRadius={5}
              fill={`var(--color-${s.key})`}
              className="stroke-transparent stroke-2"
            />
          ))}
          <CenterLabel centerValue={centerValue} centerLabel={centerLabel} />
        </RadialBarChart>
      </ChartContainer>
    );
  } else {
    const nameKey = String(props.nameKey ?? 'name');
    const valueKey = String(props.valueKey ?? 'value');
    const rows = data.map((row, index) => {
      const name = String(row[nameKey] ?? `slice-${index}`);
      return {
        ...row,
        [nameKey]: name,
        fill: `var(--color-${name})`,
      };
    });
    const config: ChartConfig = buildPieConfig(rows, nameKey);

    chart = (
      <ChartContainer
        config={config}
        className="mx-auto aspect-square w-full max-w-[250px]"
        style={{ height }}
      >
        <RadialBarChart
          data={rows}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
        >
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey={nameKey} />}
          />
          <RadialBar dataKey={valueKey} background cornerRadius={5} />
          <CenterLabel centerValue={centerValue} centerLabel={centerLabel} />
        </RadialBarChart>
      </ChartContainer>
    );
  }

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
