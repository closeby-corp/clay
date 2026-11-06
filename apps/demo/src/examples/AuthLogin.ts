import { auditRecord } from '@close-by/clay-auth';
import { ui, reactive } from '@close-by/clay';
import {
  ACCOUNT_PATH,
  DEMO_ACCOUNTS,
  getSessionUser,
  loginLimiter,
  roleLabel,
  setSessionUser,
  verifyDemoPassword,
} from './_auth';
import { oidcEnabled } from './_oidc';

/** Hidden from sidebar — Account is the single nav entry. */
export const pageMeta = {
  nav: false as const,
};

const SSO_ERRORS: Record<string, string> = {
  provider: 'The sign-in provider could not be reached. Try again later.',
  expired: 'The sign-in took too long or was started in another browser. Try again.',
  state: 'The sign-in response did not match this browser. Try again.',
  invalid_token: 'The sign-in provider returned a token that could not be verified.',
  denied: 'Your account is not allowed to use this app.',
  access_denied: 'Sign-in was cancelled.',
};

ui.page(
  '/examples/auth/login',
  () => {
    if (getSessionUser()) {
      ui.navigate(ACCOUNT_PATH);
      return;
    }

    const form = reactive({ username: '', password: '' });

    ui.container({ centered: true, width: 'sm' }, () => {
      ui.column(
        () => {
          ui.card(
            {
              title: 'Sign in to Clay Demo',
              description: 'Use a demo account to open My account and try role-based access.',
              gap: 4,
            },
            () => {
              const ssoError = ui.getUrlSearchParams().get('auth_error');
              if (ssoError) {
                ui.alert(SSO_ERRORS[ssoError] ?? `Single sign-on did not complete (${ssoError}).`, {
                  variant: 'destructive',
                });
              }
              const usernameInput = ui
                .input({
                  label: 'Email or username',
                  placeholder: 'alice or bob',
                })
                .bindValue(form, 'username');
              const passwordInput = ui
                .input({
                  label: 'Password',
                  type: 'password',
                  placeholder: '••••••••',
                })
                .bindValue(form, 'password');

              ui.label(
                'Demo accounts: Alice (administrator) or Bob (member). Password for both: password. Alice must change password on first sign-in.',
              ).classes('text-sm text-muted-foreground');

              const signIn = async () => {
                const ok = ui.validate([
                  {
                    el: usernameInput,
                    check: () =>
                      form.username.trim() ? null : 'Enter your username',
                  },
                  {
                    el: passwordInput,
                    check: () => (form.password ? null : 'Enter your password'),
                  },
                ]);
                if (!ok) {
                  ui.notify('Fix the highlighted fields', 'warning');
                  return;
                }

                const key = form.username.trim().toLowerCase();
                const limitKey = `login:${key}`;
                const gate = loginLimiter.check(limitKey);
                if (!gate.ok) {
                  const secs = Math.ceil(gate.retryAfterMs / 1000);
                  passwordInput.setError(`Too many attempts — try again in ${secs}s`);
                  ui.notify('Sign in temporarily locked', 'error');
                  return;
                }

                const account = DEMO_ACCOUNTS[key];
                if (!account || !verifyDemoPassword(key, form.password)) {
                  const failed = loginLimiter.fail(limitKey);
                  passwordInput.setError('Incorrect username or password');
                  if (!failed.ok && failed.retryAfterMs > 0) {
                    ui.notify('Too many failed attempts — locked out', 'error');
                  } else {
                    ui.notify('Sign in failed', 'error');
                  }
                  return;
                }

                loginLimiter.success(limitKey);
                usernameInput.setError(null);
                passwordInput.setError(null);

                void auditRecord('login', { actor: key });
                await setSessionUser({
                  username: key,
                  name: account.name,
                  role: account.role,
                  mustChangePassword: account.mustChangePassword,
                });
                ui.notify(`Welcome, ${account.name}`, {
                  type: 'success',
                  description: roleLabel(account.role),
                });
              }

              ui.button('Sign in', {
                onClick: signIn,
              });
              if (oidcEnabled()) {
                ui.button('Sign in with SSO', {
                  variant: 'outline',
                  // Full-page navigation: the server route redirects to the Hosted UI.
                  onClick: () => ui.redirect('/auth/login?returnTo=/examples/auth'),
                });
              }
              ui.keybind({
                keys: 'enter',
                ignoreInput: false, // important — default true skips inputs
                onPress: () => void signIn(),
              });
            },
          );
        },
        { gap: 4 },
      ).classes('min-h-screen justify-center py-12');
    });
  },
  { shell: false },
);
