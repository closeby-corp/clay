import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'ReUI · batches 3–6',
  icon: 'layers',
  order: 88,
  group: 'ReUI',
};

const SPARK = [
  { d: 'Mon', v: 12 },
  { d: 'Tue', v: 18 },
  { d: 'Wed', v: 14 },
  { d: 'Thu', v: 22 },
  { d: 'Fri', v: 19 },
  { d: 'Sat', v: 24 },
  { d: 'Sun', v: 21 },
];

const CALENDAR_EVENTS = [
  {
    id: '1',
    date: '2026-08-28',
    title: 'Design review',
    description: 'Ops dashboard',
  },
  {
    id: '2',
    date: '2026-08-30',
    title: 'Release 0.2.9',
    description: 'ReUI batches',
  },
  {
    id: '3',
    date: '2026-08-30',
    title: 'Hub sync',
    description: 'UQ Hub bump',
  },
];

ui.page('/examples/reui-batches', () => {
  const filters = ui.state({
    status: 'open',
    query: 'release',
  });
  const page = ui.state({ n: 2 });
  const qty = ui.state({ value: 4 });
  const phone = ui.state({ country: 'US', value: '5550100', e164: '15555550100' });
  const plan = ui.state({ tier: 'pro' });
  const cal = ui.state({ selected: '2026-08-30' });
  const noticeOpen = ui.state({ on: true });
  const view = ui.state({ mode: 'list' as 'list' | 'grid' | 'board' });

  exampleFrame(() => {
    ui.column(
      () => {
        exampleHeader(
          undefined,
          'ReUI batches 3–6 — admin chrome, form density, shell widgets, scheduling, table filter chips.',
        );

        ui.row({ gap: 2 }, () => {
          ui.link('ReUI · batch 1 (timeline, stepper, feed…)', '/examples/composed');
          ui.link('Charts + sparkline deep dive', '/examples/charts');
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

        exampleSection('Navigation menu', 'ui.navigationMenu — top nav with dropdown panel.');
        ui.card({ className: 'overflow-visible p-4' }, () => {
          ui.navigationMenu((menu) => {
            menu.link('Overview', { href: '#', active: true });
            menu.menu('Product', (sub) => {
              sub.link({
                label: 'Analytics',
                description: 'Charts and KPIs',
                href: '/examples/charts',
              });
              sub.link({
                label: 'Data table',
                description: 'Grid + filter chips',
                href: '/examples/datatable',
              });
            });
            menu.link('Docs', {
              onSelect: () => ui.notify('Docs clicked', 'info'),
            });
          });
        });

        ui.separator();

        exampleSection('Button group', 'ui.buttonGroup — segmented view toggles.');
        ui.auto(() => {
          ui.buttonGroup(() => {
            for (const mode of ['list', 'grid', 'board'] as const) {
              ui.button(mode, {
                size: 'sm',
                variant: 'outline',
                className: view.mode === mode ? 'bg-accent' : undefined,
                onClick: () => {
                  view.mode = mode;
                },
              });
            }
          });
          ui.label(() => `View: ${view.mode}`).classes('text-sm text-muted-foreground');
        });

        ui.separator();

        exampleSection(
          'Filter bar',
          'ui.filterBar — chips reflect active filters; change status/search below.',
        );
        ui.auto(() => {
          ui.filterBar(
            {
              chips: [
                ...(filters.status
                  ? [{ id: 'status', label: 'Status', value: filters.status }]
                  : []),
                ...(filters.query.trim()
                  ? [{ id: 'query', label: 'Search', value: filters.query.trim() }]
                  : []),
              ],
              onRemoveChip: (id) => {
                if (id === 'status') filters.status = '';
                if (id === 'query') filters.query = '';
              },
              onClear: () => {
                filters.status = '';
                filters.query = '';
              },
            },
            () => {
              ui.nativeSelect({
                options: [
                  { value: '', label: 'Any status' },
                  { value: 'open', label: 'Open' },
                  { value: 'done', label: 'Done' },
                ],
                value: filters.status,
                onChange: (v) => {
                  filters.status = v;
                },
              });
              ui.input({
                placeholder: 'Search…',
                value: filters.query,
                onInput: (v) => {
                  filters.query = v;
                },
              });
            },
          );
        });

        ui.separator();

        exampleSection('Pagination', 'ui.pagination — standalone pager (prev / numbers / next).');
        ui.auto(() => {
          ui.card({ className: 'p-4' }, () => {
            ui.pagination({
              page: page.n,
              pageCount: 8,
              onChange: (n) => {
                page.n = n;
              },
            });
          });
          ui.label(() => `Page ${page.n} of 8`).classes('text-sm text-muted-foreground');
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

        exampleSection('Stat + sparkline', 'ui.stat items accept an inline sparkline.');
        ui.stat([
          {
            title: 'Active users',
            value: '2,847',
            trend: '+12.5%',
            trendDirection: 'up',
            footer: 'Trending up this week',
            sparkline: { data: SPARK, xKey: 'd', yKey: 'v', type: 'area' },
          },
          {
            title: 'Latency p95',
            value: '142ms',
            trend: '-8%',
            trendDirection: 'down',
            description: 'Last 7 days',
            sparkline: { data: SPARK, xKey: 'd', yKey: 'v', type: 'line', color: 'var(--chart-2)' },
          },
        ]);

        ui.separator();

        exampleSection('Field + inputs', 'ui.field wraps numberField, phoneInput, and nativeSelect.');
        ui.auto(() => {
          ui.field(
            {
              label: 'Seats',
              description: 'Per workspace license',
              error: qty.value < 1 ? 'At least one seat' : '',
            },
            () => {
              ui.numberField({
                value: qty.value,
                min: 1,
                max: 99,
                step: 1,
                onChange: (v) => {
                  qty.value = v;
                },
              });
            },
          );

          ui.field({ label: 'Phone', description: 'Country dial + local digits' }, () => {
            ui.phoneInput({
              country: phone.country,
              value: phone.value,
              onChange: ({ country, value, e164 }) => {
                phone.country = country;
                phone.value = value;
                phone.e164 = e164;
              },
            });
            ui.label(() => `E.164: ${phone.e164}`).classes('text-xs text-muted-foreground');
          });

          ui.field({ label: 'Plan' }, () => {
            ui.nativeSelect({
              options: [
                { value: 'free', label: 'Free' },
                { value: 'pro', label: 'Pro' },
                { value: 'team', label: 'Team' },
              ],
              value: plan.tier,
              onChange: (v) => {
                plan.tier = v;
              },
            });
          });
        });

        ui.separator();

        exampleSection(
          'Event calendar',
          'ui.eventCalendar — month grid (dots on event days) + day list on the right.',
        );
        ui.auto(() => {
          ui.eventCalendar({
            selected: cal.selected,
            events: CALENDAR_EVENTS,
            onSelect: (date) => {
              cal.selected = date;
            },
            onEventClick: (id) => ui.notify(`Event ${id}`, 'info'),
          });
        });

        ui.separator();

        exampleSection('DataTable filter chips', 'showFilterChips — seeded filters below.');
        ui.dataTable(
          [
            { id: 1, title: 'Release train', status: 'open', owner: 'Sam' },
            { id: 2, title: 'Hub bump', status: 'done', owner: 'Alex' },
            { id: 3, title: 'Filter chips', status: 'open', owner: 'Sam' },
            { id: 4, title: 'Docs sync', status: 'done', owner: 'Jo' },
          ],
          {
            keyField: 'id',
            searchable: true,
            showFilterChips: true,
            filter: 'release',
            columnFilters: { status: JSON.stringify(['open']) },
            pageSize: 4,
            columnToggle: false,
            exportable: false,
            columns: [
              { key: 'title', header: 'Title' },
              { key: 'status', header: 'Status', filter: 'facet' },
              { key: 'owner', header: 'Owner' },
            ],
          },
        );
      },
      { gap: 6 },
    );
  });
});
