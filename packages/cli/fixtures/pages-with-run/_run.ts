import type { RunConfig } from '@badui/ui';

export function configureRun(base: RunConfig): RunConfig {
  return {
    ...base,
    authSecret: 'fixture-auth-secret',
    sessionExpiredPath: '/login',
  };
}
