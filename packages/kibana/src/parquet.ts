import type { EsHit } from './types';

export type ToParquetOptions<T = Record<string, unknown>> = {
  /**
   * Map each hit before writing.
   * Default: the hit `_source` object only (no `_id` / `_index` / `_score` / `sort`).
   */
  map?: (hit: EsHit<T>) => Record<string, unknown>;
};

export type ToParquetResult = {
  path: string;
  rows: number;
};

/** Default Parquet row: document `_source` only. */
export function sourceOnly<T>(hit: EsHit<T>): Record<string, unknown> {
  if (hit._source && typeof hit._source === 'object') {
    return { ...(hit._source as Record<string, unknown>) };
  }
  return {};
}

export function sqlQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
