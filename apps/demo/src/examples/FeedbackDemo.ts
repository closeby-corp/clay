import { ui, type TimerHandle } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Feedback & status',
  icon: 'help-circle',
  order: 52,
  group: 'Components',
  groupIcon: 'component',
};

ui.page('/examples/feedback', () => {
  let ticks = 0;
  const noticeOpen = ui.state({ on: true });
  let progressValue = 35;
  let anim: TimerHandle | null = null;

  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(
        undefined,
        'Alerts, notices, loading indicators, live updates, and timelines.',
      );

      exampleSection('Alerts', 'Default and destructive variants.');
      ui.alert('Heads up — your session is synced over WebSocket.');
      ui.alert('Something went wrong while saving.', { variant: 'destructive' });

      ui.separator();

      exampleSection(
        'JS bridge',
        'ui.runJavaScript / ui.scroll.to / ui.scroll.intoView — thin protocol ops.',
      );
      ui.row(() => {
        ui.button('Scroll bottom', {
          variant: 'outline',
          size: 'sm',
          onClick: () => ui.scroll.to({ top: 'bottom', behavior: 'smooth' }),
        });
        ui.button('Scroll top', {
          variant: 'outline',
          size: 'sm',
          onClick: () => ui.scroll.to({ top: 'top', behavior: 'smooth' }),
        });
        ui.button('console.log', {
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            ui.runJavaScript('console.log("[clay]", Date.now())');
            ui.notify('Logged to browser console', 'info');
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
      ui.separator();

      exampleSection('Live clock', 'Repeating timer updates a label every second.');
      ui.card({ title: 'Server time', description: 'Session-scoped setInterval.', gap: 4 }, () => {
        const clockLabel = ui
          .label(new Date().toLocaleTimeString())
          .classes('text-3xl font-semibold tabular-nums tracking-tight');
        const tickLabel = ui.label('Ticks: 0').classes('text-sm text-muted-foreground');

        const clock = ui.timer(1, () => {
          ticks++;
          clockLabel.setText(new Date().toLocaleTimeString());
          tickLabel.setText(`Ticks: ${ticks}`);
        });

        ui.row(() => {
          ui.button('Pause', {
            variant: 'outline',
            size: 'sm',
            onClick: () => clock.deactivate(),
          });
          ui.button('Resume', {
            variant: 'outline',
            size: 'sm',
            onClick: () => clock.activate(),
          });
          ui.button('Cancel', {
            variant: 'destructive',
            size: 'sm',
            onClick: () => {
              clock.cancel();
              ui.notify('Timer cancelled', 'warning');
              console.log('Timer cancelled');
            },
          });
        }, { gap: 2 });
      });
      ui.separator();

      exampleSection('Notice', 'ui.notice — dismissible app banner.');
      ui.auto(() => {
        if (noticeOpen.on) {
          ui.notice('Scheduled maintenance tonight 02:00–03:00 UTC.', {
            variant: 'warning',
            icon: 'triangle-alert',
            onDismiss: () => {
              noticeOpen.on = false;
            },
          });
        } else {
          ui.button('Show notice again', {
            size: 'sm',
            variant: 'outline',
            onClick: () => {
              noticeOpen.on = true;
            },
          });
        }
      });
      ui.separator();

      exampleSection(
        'Empty',
        'ui.empty — placeholder when a list/table has no rows (icon + copy + optional CTA).',
      );
      ui.empty(
        {
          title: 'No orders yet',
          description: 'This is what users see instead of a blank panel.',
          icon: 'inbox',
        },
        () => {
          ui.button('Create order', {
            size: 'sm',
            onClick: () => ui.notify('Create order', 'info'),
          });
        },
      );
      ui.separator();

      exampleSection('Timeline', 'Deploy log with collapsible body and status nodes.');
      ui.timeline({
        items: [
          {
            id: '1',
            at: '2026-08-29 22:01',
            title: 'Build started',
            description: 'ci/clay-main #4821',
            status: 'completed',
            icon: 'play',
          },
          {
            id: '2',
            at: '2026-08-29 22:04',
            title: 'Running tests',
            status: 'completed',
            badge: '486 pass',
            badgeColor: 'emerald',
          },
          {
            id: '3',
            at: '2026-08-29 22:06',
            title: 'Publishing npm',
            status: 'active',
            icon: 'upload',
            body: 'Publishing @close-by/clay-core@0.2.4\nPublishing @close-by/clay@0.2.4',
            defaultOpen: true,
          },
          {
            id: '4',
            title: 'Smoke hub',
            status: 'pending',
            description: 'Awaiting publish',
          },
        ],
      });
      ui.separator();

      exampleSection('Horizontal timeline', 'Milestone-style summary.');
      ui.timeline({
        orientation: 'horizontal',
        items: [
          { title: 'Alpha', at: 'Q1', status: 'completed' },
          { title: 'Beta', at: 'Q2', status: 'completed' },
          { title: 'GA', at: 'Q3', status: 'active' },
        ],
      });
    }, { gap: 6 });
  });
});
