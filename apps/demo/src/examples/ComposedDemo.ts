import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Composed',
  icon: 'list-tree',
  order: 87,
};

ui.page('/examples/composed', () => {
  const range = ui.state({ from: '', to: '' });
  const wizard = ui.state({ step: 0 });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ui.timeline, ui.stepper, and ui.dateRange — ReUI-style composed widgets.',
        );

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

        ui.separator();

        exampleSection('Stepper', 'Inline wizard; server owns active index.');
        ui.auto(() => {
          ui.stepper(
            {
              index: wizard.step,
              onIndexChange: (i) => {
                wizard.step = i;
              },
            },
            (s) => {
              s.step({ title: 'Plan', description: 'Pick a range' }, () => {
                ui.dateRange({
                  label: 'Report window',
                  from: range.from,
                  to: range.to,
                  onChange: ({ from, to }) => {
                    range.from = from;
                    range.to = to;
                  },
                });
              });
              s.step({ title: 'Review', description: 'Confirm filters' }, () => {
                ui.label(() =>
                  range.from && range.to
                    ? `Range: ${range.from} → ${range.to}`
                    : 'Pick a date range on the previous step.',
                ).classes('text-sm');
              });
              s.step({ title: 'Done' }, () => {
                ui.button('Finish', {
                  onClick: () => {
                    ui.notify('Stepper complete', 'success');
                    wizard.step = 0;
                  },
                });
              });
            },
          );
        });

        ui.separator();

        exampleSection('Date range', 'Presets + dual-month calendar.');
        ui.auto(() => {
          ui.dateRange({
            label: 'Filter window',
            from: range.from,
            to: range.to,
            onChange: ({ from, to }) => {
              range.from = from;
              range.to = to;
            },
          });
          ui.label(() =>
            range.from && range.to
              ? `Selected: ${range.from} – ${range.to}`
              : 'No range selected',
          ).classes('text-sm text-muted-foreground');
        });
      },
      { gap: 6 },
    );
  });
});
