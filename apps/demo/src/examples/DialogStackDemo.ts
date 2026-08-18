import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Dialog Stack',
  icon: 'layers',
  order: 86,
};

ui.page('/examples/dialog-stack', () => {
  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.dialogStack — multi-step stacked modal; server owns open and index.',
        );

        exampleSection(
          'Onboarding wizard',
          'Four steps with Back / Next and clickable step dots. Close resets via the stack API.',
        );

        const wizard = ui.dialogStack(
          { title: 'Onboarding', open: false, index: 0 },
          (stack) => {
            stack.step({ title: 'Account' }, () => {
              ui.label('Start with your account basics.')
                .classes('text-sm text-muted-foreground');
              ui.input({ label: 'Email', placeholder: 'you@example.com' });
              ui.input({ label: 'Display name', placeholder: 'Ada' });
            });

            stack.step({ title: 'Preferences' }, () => {
              ui.label('Pick defaults for this workspace.')
                .classes('text-sm text-muted-foreground');
              ui.checkbox({ label: 'Email me product updates', checked: true });
              ui.checkbox({ label: 'Weekly digest', checked: false });
            });

            stack.step({ title: 'Team' }, () => {
              ui.label('Optional — invite a teammate later.')
                .classes('text-sm text-muted-foreground');
              ui.input({ label: 'Invite email', placeholder: 'colleague@example.com' });
            });

            stack.step({ title: 'Confirm' }, () => {
              ui.label('Review and finish. You can go back to edit any step.')
                .classes('text-sm text-muted-foreground');
              ui.button('Finish', {
                onClick: () => {
                  ui.notify('Onboarding complete', 'success');
                  wizard.close();
                  wizard.setIndex(0);
                },
              });
            });
          },
        );

        ui.row(
          () => {
            ui.button('Open dialog stack', {
              onClick: () => {
                wizard.setIndex(0);
                wizard.open();
              },
            });
            ui.button('Open at step 2', {
              variant: 'outline',
              onClick: () => {
                wizard.setIndex(1);
                wizard.open();
              },
            });
          },
          { gap: 2 },
        );

        ui.label(
          'Client emits close and indexChange; the server updates open / index (like ui.dialog).',
        ).classes('text-sm text-muted-foreground');
      },
      { gap: 6 },
    );
  });
});
