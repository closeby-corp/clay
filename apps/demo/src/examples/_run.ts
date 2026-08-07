/**
 * Optional CLI hook (leading `_` so `loadPages` skips it).
 * When `badui` loads this directory, it merges demo auth + role-aware nav into `ui.run`.
 */
import type { RunConfig } from '@badui/ui';
import { demoAppShell, demoAuthOptions } from '../demo-run';

export function configureRun(base: RunConfig): RunConfig {
  const auth = demoAuthOptions();
  const next: RunConfig = {
    ...base,
    ...auth,
    // Prefer CLI port/title/clientDir; keep auth + timeouts + css from demo.
    port: base.port,
    title: base.title ?? 'BadUI Demo',
    clientDir: base.clientDir,
  };
  if (base.app) {
    // Assign the shell object directly so the `nav` getter is preserved
    // (object spread would evaluate it once into a static array).
    next.app = demoAppShell(base.app.title ?? base.title);
  }
  return next;
}
