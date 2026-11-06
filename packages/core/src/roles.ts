/**
 * Role-based visibility. The app tells Clay how to read the current user's roles
 * once (`ui.run({ getRoles })`); `forRoles`, `Element.roles()`, nav filtering and
 * `requireRole` all use it. Checks run on the server while building, so content a
 * user may not see is never sent to the browser.
 */

export type RoleResolver = () => string | readonly string[] | null | undefined;

let resolver: RoleResolver | null = null;
let warned = false;

/** Set (or clear with `null`) how the current session's roles are read. */
export function setRoleResolver(fn: RoleResolver | null): void {
  resolver = fn;
}

export function hasRoleResolver(): boolean {
  return resolver !== null;
}

/** Roles of the current session's user (`[]` when signed out or no resolver). */
export function currentRoles(): string[] {
  if (!resolver) {
    if (!warned) {
      warned = true;
      console.warn('[clay] role check without ui.run({ getRoles }) — treating the user as having no roles.');
    }
    return [];
  }
  const r = resolver();
  if (!r) return [];
  return (typeof r === 'string' ? [r] : [...r]).filter(Boolean);
}

/** True when the current user has at least one of `roles`. */
export function hasRole(roles: string | readonly string[]): boolean {
  const need = typeof roles === 'string' ? [roles] : roles;
  if (need.length === 0) return true;
  const have = new Set(currentRoles());
  return need.some((r) => have.has(r));
}

/**
 * Build `content` only for users with at least one of `roles`; otherwise build
 * `fallback` (if given). Nothing from the skipped branch reaches the client.
 */
export function forRoles(
  roles: string | readonly string[],
  content: () => void,
  fallback?: () => void,
): void {
  if (hasRole(roles)) content();
  else fallback?.();
}
