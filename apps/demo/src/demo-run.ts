import { fileURLToPath } from 'url';
import { ui, type RunConfig } from '@close-by/clay';
import { getSessionUser } from './examples/_auth';

const DEFAULT_AUTH_SECRET = 'clay-demo-auth-secret-change-me';

/** Auth + session timeout defaults shared by `main.ts` and the CLI `_run` hook. */
export function demoAuthOptions(): Pick<
  RunConfig,
  'authSecret' | 'sessionIdleMs' | 'sessionAbsoluteMs' | 'sessionExpiredPath' | 'css'
> {
  return {
    authSecret: Bun.env.CLAY_AUTH_SECRET ?? DEFAULT_AUTH_SECRET,
    sessionIdleMs: Bun.env.CLAY_SESSION_IDLE_MS
      ? parseInt(Bun.env.CLAY_SESSION_IDLE_MS)
      : 30 * 60 * 1000,
    sessionAbsoluteMs: Bun.env.CLAY_SESSION_ABSOLUTE_MS
      ? parseInt(Bun.env.CLAY_SESSION_ABSOLUTE_MS)
      : 12 * 60 * 60 * 1000,
    sessionExpiredPath: '/examples/auth/login',
    css: fileURLToPath(new URL('./globals.css', import.meta.url)),
  };
}

/** Role-aware shell nav (getter re-runs on each page mount). */
export function demoAppShell(title?: string): NonNullable<RunConfig['app']> {
  return {
    title,
    get nav() {
      const user = getSessionUser();
      return ui.navFromPages(user ? { role: user.role } : undefined);
    },
  };
}

/**
 * Full demo `ui.run` config for `main.ts`.
 * CLI directory mode merges the same pieces via `examples/_run.ts`.
 */
export function createDemoRunConfig(overrides: Partial<RunConfig> = {}): RunConfig {
  const auth = demoAuthOptions();
  return {
    ...auth,
    ...overrides,
    authSecret: overrides.authSecret ?? auth.authSecret,
    sessionIdleMs: overrides.sessionIdleMs ?? auth.sessionIdleMs,
    sessionAbsoluteMs: overrides.sessionAbsoluteMs ?? auth.sessionAbsoluteMs,
    sessionExpiredPath: overrides.sessionExpiredPath ?? auth.sessionExpiredPath,
    css: overrides.css ?? auth.css,
    app: overrides.app ?? demoAppShell(overrides.title),
  };
}
