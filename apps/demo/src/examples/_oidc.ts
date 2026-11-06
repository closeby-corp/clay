import { createOidcLogin } from '@close-by/clay-auth';
import { getAuthStore, type Role } from './_auth';

/**
 * Optional single sign-on for the demo with any OpenID Connect provider. Enabled when
 * OIDC_ISSUER and OIDC_CLIENT_ID are set. Optional:
 *   OIDC_CLIENT_SECRET   confidential clients
 *   OIDC_REDIRECT_URI    default http://localhost:<port>/auth/callback
 *   OIDC_LOGOUT_URL      provider sign-out URL when discovery has no end_session_endpoint;
 *                        `{returnTo}` is replaced with the URL-encoded return address
 *   OIDC_GROUPS_CLAIM    claim holding group names (default `groups`); group `admin` → demo admin
 */
export function demoOidcRoutes(port: number) {
  const env = Bun.env;
  if (!env.OIDC_ISSUER || !env.OIDC_CLIENT_ID) return undefined;
  const logoutTemplate = env.OIDC_LOGOUT_URL;
  const groupsClaim = env.OIDC_GROUPS_CLAIM ?? 'groups';
  const login = createOidcLogin({
    issuer: env.OIDC_ISSUER,
    clientId: env.OIDC_CLIENT_ID,
    clientSecret: env.OIDC_CLIENT_SECRET,
    redirectUri: env.OIDC_REDIRECT_URI ?? `http://localhost:${port}/auth/callback`,
    logoutUrl: logoutTemplate
      ? (back) => logoutTemplate.replace('{returnTo}', encodeURIComponent(back))
      : undefined,
    async onSignIn(claims) {
      const groups = claims[groupsClaim];
      const role: Role = Array.isArray(groups) && groups.includes('admin') ? 'admin' : 'user';
      const username = `sso:${claims.sub}`;
      const store = getAuthStore();
      await store.set({
        ...(await store.get()),
        [username]: { username, name: claims.name ?? claims.email ?? 'SSO user', role },
      });
      return username;
    },
  });
  return login.routes({
    afterLogin: '/examples/auth',
    afterLogout: '/examples/auth/login',
    errorPath: '/examples/auth/login',
  });
}

export const oidcEnabled = () => Boolean(Bun.env.OIDC_ISSUER && Bun.env.OIDC_CLIENT_ID);
