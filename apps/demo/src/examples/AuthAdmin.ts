import { ui } from '@badui/ui';
import { exampleFrame, exampleHeader } from '../chrome';
import {
  ACCOUNT_PATH,
  clearSessionUser,
  getAuthStore,
  getSessionUser,
  listSignedInUsers,
  LOGIN_PATH,
  requireAuth,
  requireRole,
  roleLabel,
  signEveryoneElseOut,
  type SessionUser,
} from './_auth';

/** Hidden from sidebar — Account is the single nav entry. */
export const pageMeta = {
  nav: false as const,
};

function accessDenied(user: SessionUser | null): void {
  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader('Access denied', 'You need administrator access for this area.');
        ui.card(
          {
            title: 'Not authorized',
            description: user
              ? `You're signed in as ${user.name} (${roleLabel(user.role)}).`
              : 'Sign in with an administrator account to continue.',
            gap: 4,
          },
          () => {
            ui.button(user ? 'Back to my account' : 'Sign in', {
              onClick: () => ui.navigate(user ? ACCOUNT_PATH : LOGIN_PATH),
            });
          },
        );
      },
      { gap: 6 },
    );
  });
}

ui.page('/examples/auth/admin', () => {
  const signedIn = requireAuth();
  if (!signedIn) return;

  const admin = requireRole('admin');
  if (!admin) {
    accessDenied(getSessionUser());
    return;
  }

  let roster = listSignedInUsers();

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          'Admin console',
          'Manage who is signed in to this demo workspace.',
        );

        const rosterUi = ui.refreshable(() => {
          ui.card(
            {
              title: 'Signed in',
              description: 'People currently mapped to a demo session.',
              gap: 3,
            },
            () => {
              if (roster.length === 0) {
                ui.label('Nobody is signed in.').classes(
                  'text-sm text-muted-foreground',
                );
                return;
              }
              ui.column(
                () => {
                  for (const person of roster) {
                    ui.row(
                      () => {
                        ui.label(person.name).classes('text-sm font-medium');
                        ui.badge(roleLabel(person.role), {
                          variant:
                            person.role === 'admin' ? 'default' : 'secondary',
                        });
                      },
                      { gap: 2 },
                    ).classes('items-center justify-between');
                  }
                },
                { gap: 2 },
              );
            },
          );
        });

        getAuthStore().subscribe(() => {
          roster = listSignedInUsers();
          rosterUi.refresh();
        });

        const revokeDialog = ui.alertDialog({
          title: 'Sign everyone else out?',
          description:
            'Other demo sessions will lose access immediately. You stay signed in.',
          confirmLabel: 'Sign others out',
          cancelLabel: 'Cancel',
          confirmVariant: 'destructive',
          open: false,
          onConfirm: async () => {
            const removed = await signEveryoneElseOut();
            ui.notify(
              removed === 0
                ? 'No other sessions to clear'
                : `Signed out ${removed} other session${removed === 1 ? '' : 's'}`,
              'success',
            );
          },
        });

        ui.card(
          {
            title: 'Privileged actions',
            description: 'Administrator-only controls for this workspace.',
            gap: 3,
          },
          () => {
            ui.button('Sign everyone else out', {
              variant: 'destructive',
              onClick: () => revokeDialog.open(),
            });
          },
        );

        ui.row(
          () => {
            ui.button('Back to my account', {
              variant: 'outline',
              onClick: () => ui.navigate(ACCOUNT_PATH),
            });
            ui.button('Sign out', {
              variant: 'ghost',
              onClick: async () => {
                await clearSessionUser();
                ui.notify('Signed out', 'info');
                ui.navigate(LOGIN_PATH);
              },
            });
          },
          { gap: 2 },
        );
      },
      { gap: 6 },
    );
  });
});
