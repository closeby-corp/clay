import { hashPassword } from '@close-by/clay-auth';
import { ui, reactive } from '@close-by/clay';
import {
  ACCOUNT_PATH,
  clearMustChangePassword,
  clearSessionUser,
  DEMO_ACCOUNTS,
  getSessionUser,
  requireAuth,
  verifyDemoPassword,
} from './_auth';

/** Hidden from sidebar. */
export const pageMeta = {
  nav: false as const,
};

ui.page(
  '/examples/auth/change-password',
  () => {
    const user = requireAuth();
    if (!user) return;

    if (!user.mustChangePassword) {
      ui.navigate(ACCOUNT_PATH);
      return;
    }

    const form = reactive({ current: '', next: '', confirm: '' });

    ui.container({ centered: true, width: 'sm' }, () => {
      ui.column(
        () => {
          ui.card(
            {
              title: 'Choose a new password',
              description: `${user.name}, you must set a new password before continuing.`,
              gap: 4,
            },
            () => {
              const currentInput = ui
                .input({
                  label: 'Current password',
                  type: 'password',
                })
                .bindValue(form, 'current');
              const nextInput = ui
                .input({
                  label: 'New password',
                  type: 'password',
                })
                .bindValue(form, 'next');
              const confirmInput = ui
                .input({
                  label: 'Confirm new password',
                  type: 'password',
                })
                .bindValue(form, 'confirm');

              ui.button('Update password', {
                onClick: async () => {
                  const ok = ui.validate([
                    {
                      el: currentInput,
                      check: () =>
                        form.current ? null : 'Enter your current password',
                    },
                    {
                      el: nextInput,
                      check: () =>
                        form.next.length >= 8
                          ? null
                          : 'Use at least 8 characters',
                    },
                    {
                      el: confirmInput,
                      check: () =>
                        form.confirm === form.next
                          ? null
                          : 'Passwords do not match',
                    },
                  ]);
                  if (!ok) {
                    ui.notify('Fix the highlighted fields', 'warning');
                    return;
                  }

                  if (!verifyDemoPassword(user.username, form.current)) {
                    currentInput.setError('Current password is incorrect');
                    ui.notify('Could not update password', 'error');
                    return;
                  }

                  const account = DEMO_ACCOUNTS[user.username];
                  if (account) {
                    account.passwordHash = hashPassword(form.next);
                    account.mustChangePassword = false;
                  }
                  await clearMustChangePassword(user.username);
                  ui.notify('Password updated', 'success');
                  ui.navigate(ACCOUNT_PATH);
                },
              });

              ui.button('Sign out', {
                variant: 'ghost',
                onClick: async () => {
                  await clearSessionUser();
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
