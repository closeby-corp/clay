import { getCurrentSession } from '@badui/core';
import { signAuthToken } from './auth-cookie';

export type AuthSessionRuntimeConfig = {
  secret: string;
  /** Cookie / token max age in ms (for signing + verify). */
  maxAgeMs: number;
  /** Where to send the client after idle/absolute expiry. */
  expiredPath: string;
};

let runtime: AuthSessionRuntimeConfig | null = null;

/** Called by BadUIServer when `authSecret` is configured. */
export function configureAuthSession(config: AuthSessionRuntimeConfig | null): void {
  runtime = config;
}

export function getAuthSessionConfig(): AuthSessionRuntimeConfig | null {
  return runtime;
}

/**
 * Issue a signed auth token and instruct the client to POST `/auth/session`,
 * optionally navigate, then soft-reconnect so `hello` sees the cookie.
 */
export function establishAuthSession(
  userId: string,
  options?: { path?: string },
): void {
  if (!runtime) {
    throw new Error(
      'establishAuthSession requires ui.run({ authSecret }) (or BadUIServer authSecret)',
    );
  }
  const token = signAuthToken(userId, runtime.secret);
  getCurrentSession()?.authSession('establish', { token, path: options?.path });
}

/**
 * Instruct the client to DELETE `/auth/session`, optionally navigate, then soft-reconnect.
 */
export function clearAuthSession(options?: { path?: string }): void {
  getCurrentSession()?.authSession('clear', { path: options?.path });
}

/** Soft-reconnect: close the WebSocket so the next hello includes fresh cookies. */
export function reconnect(): void {
  getCurrentSession()?.reconnect();
}
