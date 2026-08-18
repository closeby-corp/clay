import type { RunConfig } from '@close-by/clay';

export function configureRun(base: RunConfig): RunConfig {
  return {
    ...base,
    authSecret: 'fixture-auth-secret',
    sessionExpiredPath: '/login',
  };
}
