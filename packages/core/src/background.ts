import type { RenderContext } from './context';
import { getCurrentContext } from './context';

/**
 * Run async work in the background; push signal updates when complete.
 */
export function runInBackground(
  fn: () => void | Promise<void>,
  ctx?: RenderContext | null,
): void {
  const context = ctx ?? getCurrentContext();
  if (!context) {
    void Promise.resolve().then(fn);
    return;
  }

  Promise.resolve()
    .then(fn)
    .then(() => {
      context.pushSignals(context.exportSignals());
    })
    .catch((err) => {
      console.error('[BadUI] Background task failed:', err);
    });
}
