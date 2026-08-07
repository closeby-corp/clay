import { getCurrentSession } from '@badui/core';

export type AuthGuardsOptions<TUser> = {
  /** Resolve the signed-in user for the current session (sync). */
  getUser: () => TUser | null;
  /** Navigate when unauthenticated. */
  onUnauthenticated: () => void;
  /**
   * Optional: when the user must change their password, navigate away
   * (unless the current path is already the change-password page).
   */
  mustChangePassword?: {
    check: (user: TUser) => boolean;
    changePasswordPath: string;
    getPath?: () => string;
    navigate: (path: string) => void;
  };
};

/**
 * Framework-flavored authz helpers (page builders still call these for real enforcement).
 */
export function createAuthGuards<TUser>(options: AuthGuardsOptions<TUser>) {
  function requireAuth(): TUser | null {
    const user = options.getUser();
    if (!user) {
      options.onUnauthenticated();
      return null;
    }
    const mcp = options.mustChangePassword;
    if (mcp?.check(user)) {
      const path = mcp.getPath?.() ?? getCurrentSession()?.path ?? '';
      if (path !== mcp.changePasswordPath) {
        mcp.navigate(mcp.changePasswordPath);
        return null;
      }
    }
    return user;
  }

  function requireRole(
    role: string | string[],
    opts?: {
      /** Extract role string(s) from the user. Default: `(u as { role: string }).role`. */
      getRoles?: (user: TUser) => string | string[];
    },
  ): TUser | null {
    const user = requireAuth();
    if (!user) return null;
    const getRoles =
      opts?.getRoles ??
      ((u: TUser) => (u as { role?: string }).role ?? []);
    const have = new Set(
      ([] as string[]).concat(getRoles(user) ?? []).filter(Boolean),
    );
    const need = Array.isArray(role) ? role : [role];
    if (!need.some((r) => have.has(r))) return null;
    return user;
  }

  return { requireAuth, requireRole };
}
