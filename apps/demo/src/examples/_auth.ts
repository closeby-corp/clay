import { getCurrentSession } from '@badui/core';
import {
  createAuthGuards,
  createLoginLimiter,
  hashPassword,
  verifyPassword,
} from '@badui/auth';
import { ui } from '@badui/ui';

export type Role = 'admin' | 'user';

export type SessionUser = {
  username: string;
  name: string;
  role: Role;
  mustChangePassword?: boolean;
};

export type AuthMap = Record<string, SessionUser>;

export type DemoAccount = {
  passwordHash: string;
  name: string;
  role: Role;
  mustChangePassword?: boolean;
};

/** Shared demo password hash (plaintext never stored after seed). */
const DEMO_PASSWORD_HASH = hashPassword('password');

export const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  alice: {
    passwordHash: DEMO_PASSWORD_HASH,
    name: 'Alice',
    role: 'admin',
    mustChangePassword: true,
  },
  bob: {
    passwordHash: DEMO_PASSWORD_HASH,
    name: 'Bob',
    role: 'user',
  },
};

const LOGIN_PATH = '/examples/auth/login';
const ACCOUNT_PATH = '/examples/auth';
const CHANGE_PASSWORD_PATH = '/examples/auth/change-password';

/** Online roster for the admin console (username → profile). */
const authStore = ui.storage.app.create<AuthMap>('demoAuth', {}, { persist: false });

/** Flags cleared after a forced password change (username → still must change). */
const mustChangeStore = ui.storage.app.create<Record<string, boolean>>(
  'demoAuthMustChange',
  { alice: true },
  { persist: false },
);

let authMirror: AuthMap = {};
authStore.subscribe((map) => {
  authMirror = map;
});

let mustChangeMirror: Record<string, boolean> = { alice: true };
mustChangeStore.subscribe((map) => {
  mustChangeMirror = map;
});

export const loginLimiter = createLoginLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  lockoutMs: 15 * 60 * 1000,
});

export function getAuthStore() {
  return authStore;
}

export function roleLabel(role: Role): string {
  return role === 'admin' ? 'Administrator' : 'Member';
}

export function verifyDemoPassword(username: string, password: string): boolean {
  const account = DEMO_ACCOUNTS[username];
  if (!account) return false;
  return verifyPassword(password, account.passwordHash);
}

function mustChangePassword(user: SessionUser): boolean {
  if (mustChangeMirror[user.username]) return true;
  return !!user.mustChangePassword;
}

/**
 * Signed-in profile from the trusted cookie identity (`resolveUserId` → session.userId).
 */
export function getSessionUser(): SessionUser | null {
  const id = getCurrentSession()?.userId ?? null;
  if (!id) return null;
  if (authMirror[id]) {
    const u = authMirror[id]!;
    return {
      ...u,
      mustChangePassword: mustChangePassword(u),
    };
  }
  const account = DEMO_ACCOUNTS[id];
  if (!account) return null;
  const user: SessionUser = {
    username: id,
    name: account.name,
    role: account.role,
    mustChangePassword: !!mustChangeMirror[id] || !!account.mustChangePassword,
  };
  return user;
}

const guards = createAuthGuards<SessionUser>({
  getUser: getSessionUser,
  onUnauthenticated: () => ui.navigate(LOGIN_PATH),
  mustChangePassword: {
    check: mustChangePassword,
    changePasswordPath: CHANGE_PASSWORD_PATH,
    getPath: () => getCurrentSession()?.path ?? '',
    navigate: (path) => ui.navigate(path),
  },
});

export const requireAuth = guards.requireAuth;
export const requireRole = (role: Role) => guards.requireRole(role);

/** Record roster presence and establish the signed auth cookie + soft-reconnect. */
export async function setSessionUser(
  user: SessionUser,
  options?: { path?: string },
): Promise<void> {
  const next = { ...(await authStore.get()), [user.username]: user };
  await authStore.set(next);
  const path =
    options?.path ??
    (mustChangePassword(user) ? CHANGE_PASSWORD_PATH : ACCOUNT_PATH);
  ui.establishAuthSession(user.username, { path });
}

/** Clear cookie + remove this user from the online roster. */
export async function clearSessionUser(options?: { path?: string }): Promise<void> {
  const user = getSessionUser();
  if (user) {
    const map = { ...(await authStore.get()) };
    delete map[user.username];
    await authStore.set(map);
  }
  ui.clearAuthSession({ path: options?.path ?? LOGIN_PATH });
}

export function listSignedInUsers(): SessionUser[] {
  return Object.values(authMirror).map((u) => ({
    ...u,
    mustChangePassword: mustChangePassword(u),
  }));
}

export async function signEveryoneElseOut(): Promise<number> {
  const me = getSessionUser();
  if (!me) return 0;
  const map = await authStore.get();
  const removed = Object.keys(map).filter((k) => k !== me.username).length;
  await authStore.set({ [me.username]: me });
  return removed;
}

export async function clearMustChangePassword(username: string): Promise<void> {
  const map = { ...(await mustChangeStore.get()) };
  delete map[username];
  await mustChangeStore.set(map);
  const roster = { ...(await authStore.get()) };
  if (roster[username]) {
    roster[username] = { ...roster[username]!, mustChangePassword: false };
    await authStore.set(roster);
  }
}

export { LOGIN_PATH, ACCOUNT_PATH, CHANGE_PASSWORD_PATH };
