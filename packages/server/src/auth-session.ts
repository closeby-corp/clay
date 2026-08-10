import { getCurrentSession } from '@clay/core';
import { signAuthToken } from './auth-cookie';

/** Runtime config for signed auth cookies (set by ClayServer when `authSecret` is set). */
export type AuthSessionRuntimeConfig = {
  secret: string;
  /** Cookie / token max age in ms (for signing + verify). */
  maxAgeMs: number;
  /** Where to send the client after idle/absolute expiry. */
  expiredPath: string;
};

let runtime: AuthSessionRuntimeConfig | null = null;

/** Called by ClayServer when `authSecret` is configured. */
export function configureAuthSession(config: AuthSessionRuntimeConfig | null): void {
  runtime = config;
}

/** Current auth-session runtime (set when `authSecret` is configured), or `null`. */
export function getAuthSessionConfig(): AuthSessionRuntimeConfig | null {
  return runtime;
}

/**
 * Issue a signed auth token and instruct the client to POST `/auth/session`,
 * optionally navigate (`options.path`), then soft-reconnect so `hello` sees the cookie.
 * Requires `ui.run({ authSecret })`.
 */
export function establishAuthSession(
  userId: string,
  options?: { path?: string },
): void {
  if (!runtime) {
    throw new Error(
      'establishAuthSession requires ui.run({ authSecret }) (or ClayServer authSecret)',
    );
  }
  const token = signAuthToken(userId, runtime.secret);
  getCurrentSession()?.authSession('establish', { token, path: options?.path });
}

/**
 * Instruct the client to DELETE `/auth/session`, optionally navigate
 * (`options.path`), then soft-reconnect.
 */
export function clearAuthSession(options?: { path?: string }): void {
  getCurrentSession()?.authSession('clear', { path: options?.path });
}

/** Soft-reconnect: close the WebSocket so the next hello includes fresh cookies. */
export function reconnect(): void {
  getCurrentSession()?.reconnect();
}
