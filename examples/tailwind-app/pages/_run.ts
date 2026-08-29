import type { RunConfig } from '@close-by/clay';
import { resolve } from 'path';

/** Merged by `clay ./pages` — keep in sync with index.ts. */
export function configureRun(base: RunConfig): RunConfig {
  return {
    ...base,
    port: base.port || 4300,
    css: resolve(import.meta.dir, '../src/tokens.css'),
  };
}
