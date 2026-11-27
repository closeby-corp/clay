import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader } from '../chrome';
import {
  ACCOUNT_PATH,
  getSessionUser,
  LOGIN_PATH,
  requireAuth,
  roleLabel,
  type SessionUser,
} from './_auth';

export function accessDenied(user: SessionUser | null): void {
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

/** `ui.run({ forbidden })` for the demo: sign in first, else the Access denied card. */
export function demoForbidden(): void {
  if (!requireAuth()) return;
  accessDenied(getSessionUser());
}
