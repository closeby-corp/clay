import { getCurrentSession, setCurrentSession } from '@badui/core';
import { ui } from '@badui/ui';
import { exampleFrame } from '../chrome';
import {
  clearSessionUser,
  LOGIN_PATH,
  requireAuth,
  roleLabel,
} from './_auth';

export const pageMeta = {
  label: 'Account',
  icon: 'lock',
  order: 73,
};

ui.page('/examples/auth', () => {
  const user = requireAuth();
  if (!user) return;

  const session = getCurrentSession();

  exampleFrame(() => {
    ui.column(
      () => {
        ui.row(
          () => {
            ui.column(
              () => {
                ui.label(`Welcome back, ${user.name}`).classes(
                  'text-2xl font-semibold tracking-tight',
                );
                ui.label('Manage your profile, preferences, and security.').classes(
                  'text-sm text-muted-foreground',
                );
              },
              { gap: 1 },
            );
            ui.badge(roleLabel(user.role), {
              variant: user.role === 'admin' ? 'default' : 'secondary',
            });
          },
          { gap: 3 },
        ).classes('items-start justify-between');

        ui.card(
          {
            title: 'Profile',
            description: 'How you appear in this demo workspace.',
            gap: 3,
          },
          () => {
            ui.row(
              () => {
                ui.avatar({ fallback: user.name.slice(0, 2).toUpperCase() });
                ui.column(
                  () => {
                    ui.label(user.name).classes('text-sm font-medium');
                    ui.label(roleLabel(user.role)).classes(
                      'text-sm text-muted-foreground',
                    );
                  },
                  { gap: 0 },
                );
              },
              { gap: 3 },
            ).classes('items-center');
          },
        );

        ui.card(
          {
            title: 'Preferences',
            description: 'Saved for this browser while you stay signed in.',
            gap: 3,
          },
          () => {
            const prefSwitch = ui.switch({
              label: 'Email me product updates',
              checked: false,
              onChange: async (checked) => {
                await ui.storage.user.set('authDemoNotify', checked);
                ui.notify(
                  checked ? 'Notifications on' : 'Notifications off',
                  'success',
                );
              },
            });

            if (session) {
              void (async () => {
                setCurrentSession(session);
                try {
                  const saved =
                    (await ui.storage.user.get<boolean>('authDemoNotify')) ?? false;
                  prefSwitch.setValue(saved);
                } finally {
                  setCurrentSession(null);
                }
              })();
            }
          },
        );

        ui.card(
          {
            title: 'Admin console',
            description:
              user.role === 'admin'
                ? 'You have administrator access to the demo workspace.'
                : 'Administrators only — members can open the door and will see Access denied.',
            gap: 3,
          },
          () => {
            ui.button('Open admin console', {
              onClick: () => ui.navigate('/examples/auth/admin'),
            });
            if (user.role !== 'admin') {
              ui.label('Administrators only').classes(
                'text-xs text-muted-foreground',
              );
            }
          },
        );

        ui.card(
          {
            title: 'Security',
            description: 'End your session on this browser.',
            gap: 3,
          },
          () => {
            ui.button('Sign out', {
              variant: 'outline',
              onClick: async () => {
                await clearSessionUser();
                ui.notify('Signed out', 'info');
              },
            });
          },
        );

        ui.collapsible({ title: 'How this demo works' }, () => {
          ui.column(
            () => {
              ui.label(
                'Sign-in issues a signed HttpOnly cookie via POST /auth/session, then soft-reconnects so WebSocket hello trusts resolveUserId from that cookie. Reconnects stay signed in.',
              ).classes('text-sm text-muted-foreground');
              ui.label(
                'Optional sessionIdleMs / sessionAbsoluteMs on ui.run expire idle sessions (clear cookie + redirect). The admin roster is a separate ui.storage.app map of who is online.',
              ).classes('text-sm text-muted-foreground');
            },
            { gap: 2 },
          );
        });
      },
      { gap: 6 },
    );
  });
});
