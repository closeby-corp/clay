import { getCurrentSession } from '@close-by/clay-core';

/** Options for {@link createAuthGuards}. */
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
 * Authz helpers for page builders — call inside `ui.page` for real enforcement
 * (nav `roles` meta is UX-only).
 *
 * @example
 * ```ts
 * const { requireAuth, requireRole } = createAuthGuards({
 *   getUser: () => loadUser(),
 *   onUnauthenticated: () => ui.navigate('/login'),
 * });
 * ui.page('/admin', () => {
 *   if (!requireRole('admin')) return;
 *   // …
 * });
 * ```
 */
export function createAuthGuards<TUser>(options: AuthGuardsOptions<TUser>) {
  /** Return the signed-in user, or navigate away and return `null`. */
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

  /**
   * Require auth and at least one of `role`. Returns `null` (no navigate) when
   * the user lacks the role — handle UI yourself.
   */
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
