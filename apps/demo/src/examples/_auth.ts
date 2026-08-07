import { getCurrentSession } from '@badui/core';
import { ui } from '@badui/ui';

export type Role = 'admin' | 'user';

export type SessionUser = {
  username: string;
  name: string;
  role: Role;
};

export type AuthMap = Record<string, SessionUser>;

export const DEMO_ACCOUNTS: Record<
  string,
  { password: string; name: string; role: Role }
> = {
  alice: { password: 'password', name: 'Alice', role: 'admin' },
  bob: { password: 'password', name: 'Bob', role: 'user' },
};

const LOGIN_PATH = '/examples/auth/login';
const ACCOUNT_PATH = '/examples/auth';

const authStore = ui.storage.app.create<AuthMap>('demoAuth', {}, { persist: false });

/** Sync mirror of the auth map (persist: false → memory-only; mount builders stay sync). */
let authMirror: AuthMap = {};
authStore.subscribe((map) => {
  authMirror = map;
});

export function getAuthStore() {
  return authStore;
}

export function roleLabel(role: Role): string {
  return role === 'admin' ? 'Administrator' : 'Member';
}

function anonId(): string | null {
  return getCurrentSession()?.userId ?? null;
}

export function getSessionUser(): SessionUser | null {
  const id = anonId();
  if (!id) return null;
  return authMirror[id] ?? null;
}

export async function setSessionUser(user: SessionUser): Promise<void> {
  const id = anonId();
  if (!id) {
    ui.notify('Cannot sign in — missing browser identity', 'error');
    return;
  }
  const next = { ...(await authStore.get()), [id]: user };
  await authStore.set(next);
}

export async function clearSessionUser(): Promise<void> {
  const id = anonId();
  if (!id) return;
  const map = { ...(await authStore.get()) };
  delete map[id];
  await authStore.set(map);
}

/** Signed-in users for the admin roster (friendly names only). */
export function listSignedInUsers(): SessionUser[] {
  return Object.values(authMirror);
}

/** Keep only the current session; revoke everyone else. */
export async function signEveryoneElseOut(): Promise<number> {
  const id = anonId();
  if (!id) return 0;
  const map = await authStore.get();
  const me = map[id];
  const removed = Object.keys(map).filter((k) => k !== id).length;
  await authStore.set(me ? { [id]: me } : {});
  return removed;
}

/**
 * Require a signed-in demo account. Navigates to Sign in when missing.
 * Returns null if redirected (caller should return early).
 */
export function requireAuth(): SessionUser | null {
  const user = getSessionUser();
  if (!user) {
    ui.navigate(LOGIN_PATH);
    return null;
  }
  return user;
}

/**
 * Require auth + role. Returns null when signed out (navigates to Sign in)
 * or when the role does not match (caller renders Access denied).
 */
export function requireRole(role: Role): SessionUser | null {
  const user = requireAuth();
  if (!user) return null;
  if (user.role !== role) return null;
  return user;
}

export { LOGIN_PATH, ACCOUNT_PATH };
