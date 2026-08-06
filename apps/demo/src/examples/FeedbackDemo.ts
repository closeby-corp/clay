import { ui, type TimerHandle } from '@badui/ui';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Feedback',
  icon: 'help-circle',
  order: 75,
};

ui.page('/examples/feedback', () => {
  let progressValue = 35;
  let anim: TimerHandle | null = null;

  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(
        undefined,
        'Alerts, spinner, progress, separators, and ui.theme.set (Appearance).',
      );

      exampleSection('Alerts', 'Default and destructive variants.');
      ui.alert('Heads up — your session is synced over WebSocket.');
      ui.alert('Something went wrong while saving.', { variant: 'destructive' });

      ui.separator();

      exampleSection('Appearance', 'ui.theme.set("light" | "dark" | "system") — server pushes theme to the client.');
      ui.row(() => {
        ui.button('Light', {
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            ui.theme.set('light');
            ui.notify('Theme: light', 'info');
          },
        });
        ui.button('Dark', {
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            ui.theme.set('dark');
            ui.notify('Theme: dark', 'info');
          },
        });
        ui.button('System', {
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            ui.theme.set('system');
            ui.notify('Theme: system', 'info');
          },
        });
      }, { gap: 2 });

      ui.separator();

      exampleSection('Spinner', 'Inline loading indicator.');
      ui.row(() => {
        ui.spinner();
        ui.label('Loading…').classes('text-sm text-muted-foreground');
      }, { gap: 2 }).classes('items-center');

      ui.separator();

      exampleSection('Progress', 'Driven by buttons and a short timer.');
      ui.card(
        { title: 'Upload progress', description: 'Value is 0–100 on the element.', gap: 4 },
        () => {
          const bar = ui.progress({ value: progressValue });
          const pct = ui
            .label(`${progressValue}%`)
            .classes('text-sm tabular-nums text-muted-foreground');

          const sync = () => {
            bar.setValue(progressValue);
            pct.setText(`${progressValue}%`);
          };

          ui.row(() => {
            ui.button('−10', {
              variant: 'outline',
              size: 'sm',
              onClick: () => {
                anim?.cancel();
                anim = null;
                progressValue = Math.max(0, progressValue - 10);
                sync();
              },
            });
            ui.button('+10', {
              variant: 'outline',
              size: 'sm',
              onClick: () => {
                anim?.cancel();
                anim = null;
                progressValue = Math.min(100, progressValue + 10);
                sync();
              },
            });
            ui.button('Animate', {
              size: 'sm',
              onClick: () => {
                anim?.cancel();
                progressValue = 0;
                sync();
                anim = ui.timer(0.15, () => {
                  progressValue = Math.min(100, progressValue + 5);
                  sync();
                  if (progressValue >= 100) {
                    anim?.cancel();
                    anim = null;
                    ui.notify('Complete', 'success');
                  }
                });
              },
            });
          }, { gap: 2 });
        },
      );
    }, { gap: 6 });
  });
});
