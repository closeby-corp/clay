import { useId, type CSSProperties } from 'react';
import { Area, AreaChart, Line, LineChart } from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { cssSafeKey, useLiveChartAnimation, useStableValue, type ChartHeadline } from './chart-shared';

function parseSparklineHeadline(props: Record<string, unknown>): ChartHeadline | undefined {
  if (props.headline && typeof props.headline === 'object') {
    const h = props.headline as Record<string, unknown>;
    if (h.value != null) {
      return {
        value: h.value as string | number,
        trend: h.trend != null ? String(h.trend) : undefined,
        trendDirection:
          h.trendDirection === 'up' || h.trendDirection === 'down'
            ? h.trendDirection
            : undefined,
      };
    }
  }
  if (props.value != null) {
    return {
      value: props.value as string | number,
      trend: props.trend != null ? String(props.trend) : undefined,
      trendDirection:
        props.trendDirection === 'up' || props.trendDirection === 'down'
          ? (props.trendDirection as 'up' | 'down')
          : undefined,
    };
  }
  return undefined;
}

export function BoundSparkline({
  props,
  className,
  style,
}: {
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
}) {
  const data = (props.data as Record<string, unknown>[]) ?? [];
  const yKey = String(props.yKey ?? 'y');
  const type = props.type === 'line' ? 'line' : 'area';
  const title = props.title ? String(props.title) : '';
  const description = props.description ? String(props.description) : '';
  const headline = parseSparklineHeadline(props);
  const height = Number(props.height ?? 48);
  const color = props.color ? String(props.color) : 'var(--chart-1)';
  const styleProp =
    typeof style === 'object' && style ? (style as CSSProperties) : undefined;
  const chartKey = cssSafeKey(yKey);
  const gradientId = `spark-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}-${chartKey}`;
  const config = useStableValue({
    [chartKey]: { label: yKey, color },
  });
  const xKey = props.xKey ? String(props.xKey) : 'x';
  const anim = useLiveChartAnimation(data, xKey, props.animate);

  const chart = (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      {type === 'line' ? (
        <LineChart accessibilityLayer data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={anim}
            animationDuration={400}
          />
        </LineChart>
      ) : (
        <AreaChart accessibilityLayer data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            fill={`url(#${gradientId})`}
            strokeWidth={2}
            dot={false}
            isAnimationActive={anim}
            animationDuration={400}
          />
        </AreaChart>
      )}
    </ChartContainer>
  );

  const trendVariant =
    headline?.trendDirection === 'up'
      ? 'green'
      : headline?.trendDirection === 'down'
        ? 'red'
        : undefined;

  return (
    <Card
      className={cn('w-full min-w-0', className, props.className as string | undefined)}
      style={styleProp}
    >
      <CardHeader className="pb-2">
        {title ? <CardTitle className="text-sm font-medium">{title}</CardTitle> : null}
        {description ? (
          <CardDescription className="text-xs">{description}</CardDescription>
        ) : null}
        {headline ? (
          <div className="flex flex-wrap items-baseline gap-2 pt-1">
            <span className="text-2xl font-semibold tabular-nums tracking-tight">
              {headline.value}
            </span>
            {headline.trend ? (
              <Badge variant="outline" color={trendVariant} className="font-normal">
                {headline.trend}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="px-2 pb-3 pt-0">{chart}</CardContent>
    </Card>
  );
}
