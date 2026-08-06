import type { ChartSeries } from '../../chart-shared';

/** Series keys (shorthand) or full `ChartSeries` descriptors. */
export type SeriesInput = string[] | ChartSeries[];

/** Shared chrome options for chart builders. */
export type ChartChromeOpts = {
  title?: string;
  description?: string;
  height?: number;
  className?: string;
};

/** Map string keys to `{ key, label }` series, or pass through full descriptors. */
export function normalizeSeries(input: SeriesInput): ChartSeries[] {
  return input.map((item) =>
    typeof item === 'string' ? { key: item, label: item } : item,
  );
}

/** Mutable chrome fields shared by builder classes. */
export type ChromeState = {
  title?: string;
  description?: string;
  height?: number;
  className?: string;
};

export function applyChrome(state: ChromeState, opts?: ChartChromeOpts): ChromeState {
  if (!opts) return { ...state };
  return {
    title: opts.title ?? state.title,
    description: opts.description ?? state.description,
    height: opts.height ?? state.height,
    className: opts.className ?? state.className,
  };
}
