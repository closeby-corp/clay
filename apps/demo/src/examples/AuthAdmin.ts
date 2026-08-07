import { auditRecord, listAuditRecords, clearAuditRecords } from '@badui/auth';
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

/** Admin-only nav entry (UX filter via pageMeta.roles; page still calls requireRole). */
export const pageMeta = {
  label: 'Admin',
  icon: 'shield',
  order: 74,
  roles: ['admin'],
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

function formatAuditTime(at: number): string {
  try {
    return new Date(at).toLocaleString();
  } catch {
    return String(at);
  }
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
  let auditRows: Awaited<ReturnType<typeof listAuditRecords>> = [];

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          'Admin console',
          'Manage who is signed in and review recent admin actions.',
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

        const auditUi = ui.refreshable(() => {
          ui.card(
            {
              title: 'Audit log',
              description: 'Recent privileged actions in this demo process.',
              gap: 3,
            },
            () => {
              if (auditRows.length === 0) {
                ui.label('No audit events yet.').classes(
                  'text-sm text-muted-foreground',
                );
                return;
              }
              ui.column(
                () => {
                  for (const row of auditRows.slice(0, 20)) {
                    ui.row(
                      () => {
                        ui.column(
                          () => {
                            ui.label(row.action).classes('text-sm font-medium');
                            ui.label(
                              [
                                row.actor ?? 'unknown',
                                row.target ? `→ ${row.target}` : null,
                                formatAuditTime(row.at),
                              ]
                                .filter(Boolean)
                                .join(' · '),
                            ).classes('text-xs text-muted-foreground');
                          },
                          { gap: 0 },
                        );
                      },
                      { gap: 2 },
                    );
                  }
                },
                { gap: 2 },
              );
            },
          );
        });

        void (async () => {
          auditRows = await listAuditRecords();
          auditUi.refresh();
        })();

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
            await auditRecord('sign_everyone_else_out', {
              details: { removed },
            });
            auditRows = await listAuditRecords();
            auditUi.refresh();
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
            ui.button('Clear audit log', {
              variant: 'outline',
              onClick: async () => {
                const ok = await ui.confirm('Clear the demo audit log?');
                if (!ok) return;
                await clearAuditRecords();
                await auditRecord('audit_cleared');
                auditRows = await listAuditRecords();
                auditUi.refresh();
                ui.notify('Audit log cleared', 'info');
              },
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
