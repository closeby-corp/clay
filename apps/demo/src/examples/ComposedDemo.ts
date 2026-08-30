import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'ReUI · batch 1',
  icon: 'list-tree',
  order: 87,
  group: 'ReUI',
  groupIcon: 'layers',
};

const SPARK = [
  { d: 'Mon', v: 12 },
  { d: 'Tue', v: 18 },
  { d: 'Wed', v: 14 },
  { d: 'Thu', v: 22 },
  { d: 'Fri', v: 19 },
];

type FeedUnit = {
  id: string;
  ok: boolean;
  summary: string;
  error?: string;
  isNew?: boolean;
  at: number;
};

function relativeMins(ms: number, now: number): string {
  const mins = Math.max(0, Math.floor((now - ms) / 60_000));
  if (mins < 1) return 'just now';
  if (mins === 1) return '1m ago';
  return `${mins}m ago`;
}

ui.page('/examples/composed', () => {
  const range = ui.state({ from: '', to: '' });
  const wizard = ui.state({ step: 0 });
  const feed = ui.state({
    selectedId: 'unit-a',
    clock: Date.now(),
    units: [
      {
        id: 'unit-a',
        ok: true,
        summary: 'client · healthy',
        at: Date.now() - 120_000,
      },
      {
        id: 'unit-b',
        ok: false,
        summary: 'worker · degraded',
        error: 'Queue lag 4.2s',
        isNew: true,
        at: Date.now() - 45_000,
      },
      {
        id: 'unit-c',
        ok: true,
        summary: 'api · ok',
        at: Date.now() - 15_000,
      },
    ] as FeedUnit[],
  });

  ui.timer(30, () => {
    feed.clock = Date.now();
  });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ReUI batch 1 — timeline, stepper, dateRange, feedList/feedRow, sparkline.',
        );

        ui.row({ gap: 2 }, () => {
          ui.link('ReUI batches 3–6', '/examples/reui-batches');
          ui.link('Full chart zoo', '/examples/charts');
        });

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

        ui.separator();

        exampleSection(
          'Feed list',
          'ui.feedList + ui.feedRow — ops live feed (not ui.list). Trailing times tick via ui.timer.',
        );
        ui.auto(() => {
          ui.feedList({ className: 'max-w-xl' }, () => {
            for (const unit of feed.units) {
              ui.feedRow(
                {
                  selected: feed.selectedId === unit.id,
                  status: { color: unit.ok ? 'emerald' : 'red' },
                  title: unit.id,
                  meta: unit.summary,
                  issue: unit.error,
                  marker: unit.isNew ? 'new' : undefined,
                  trailing: () => relativeMins(unit.at, feed.clock),
                  onClick: () => {
                    feed.selectedId = unit.id;
                  },
                },
                () => {
                  ui.badge(unit.ok ? 'healthy' : 'degraded', {
                    size: 'xs',
                    color: unit.ok ? 'emerald' : 'red',
                    variant: 'outline',
                  });
                },
              );
            }
          });
        });

        ui.separator();

        exampleSection('Sparkline', 'ui.sparkline — compact KPI card (batch 2; also on Charts demo).');
        ui.row({ gap: 4, className: 'flex-wrap' }, () => {
          ui.sparkline({
            title: 'Throughput',
            data: SPARK,
            xKey: 'd',
            yKey: 'v',
            value: '2.4k/s',
            trend: '+8.2%',
            trendDirection: 'up',
            type: 'area',
          });
          ui.sparkline({
            title: 'Error rate',
            data: SPARK,
            xKey: 'd',
            yKey: 'v',
            value: '0.12%',
            trend: '-3%',
            trendDirection: 'down',
            type: 'line',
            color: 'var(--chart-2)',
          });
        });
      },
      { gap: 6 },
    );
  });
});
