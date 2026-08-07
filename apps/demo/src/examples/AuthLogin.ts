import { ui, reactive } from '@badui/ui';
import {
  ACCOUNT_PATH,
  DEMO_ACCOUNTS,
  getSessionUser,
  roleLabel,
  setSessionUser,
} from './_auth';

/** Hidden from sidebar — Account is the single nav entry. */
export const pageMeta = {
  nav: false as const,
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
              title: 'Sign in to BadUI Demo',
              description: 'Use a demo account to open My account and try role-based access.',
              gap: 4,
            },
            () => {
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
                'Demo accounts: Alice (administrator) or Bob (member). Password for both: password.',
              ).classes('text-sm text-muted-foreground');

              ui.button('Sign in', {
                onClick: async () => {
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
                  const account = DEMO_ACCOUNTS[key];
                  if (!account || account.password !== form.password) {
                    passwordInput.setError('Incorrect username or password');
                    ui.notify('Sign in failed', 'error');
                    return;
                  }

                  usernameInput.setError(null);
                  passwordInput.setError(null);

                  await setSessionUser({
                    username: key,
                    name: account.name,
                    role: account.role,
                  });
                  ui.notify(`Welcome, ${account.name}`, {
                    type: 'success',
                    description: roleLabel(account.role),
                  });
                  ui.navigate(ACCOUNT_PATH);
                },
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
