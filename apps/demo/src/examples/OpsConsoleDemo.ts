/**
 * Ops console dogfood — one real master–detail surface using current Clay APIs
 * (batches 1–7). Prefer this over another ReUI showcase when testing density.
 */
import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Ops console',
  icon: 'radar',
  order: 10,
  group: 'ReUI',
  groupIcon: 'layers',
};

type OrderStatus = 'ok' | 'warn' | 'error' | 'processing';
type Region = 'eu-west-1' | 'us-east-1' | 'ap-south-1';

type Order = {
  id: string;
  status: OrderStatus;
  city: string;
  region: Region;
  owner: string;
  amount: number;
  queueMs: number;
  isNew?: boolean;
  error?: string;
  at: number;
  events: Array<{ at: string; step: string; ms: number }>;
};

const SEED: Order[] = [
  {
    id: 'ORD-1042',
    status: 'processing',
    city: 'Lisbon',
    region: 'eu-west-1',
    owner: 'ops@example.com',
    amount: 1280,
    queueMs: 4200,
    isNew: true,
    at: Date.now() - 45_000,
    events: [
      { at: '14:02', step: 'intake', ms: 12 },
      { at: '14:02', step: 'validate', ms: 48 },
      { at: '14:03', step: 'queue', ms: 4200 },
    ],
  },
  {
    id: 'ORD-1038',
    status: 'error',
    city: 'Porto',
    region: 'eu-west-1',
    owner: 'billing@example.com',
    amount: 640,
    queueMs: 0,
    error: 'Partner timeout · retry 2/3',
    at: Date.now() - 180_000,
    events: [
      { at: '13:50', step: 'intake', ms: 9 },
      { at: '13:51', step: 'partner', ms: 30_000 },
    ],
  },
  {
    id: 'ORD-1031',
    status: 'warn',
    city: 'Faro',
    region: 'eu-west-1',
    owner: 'ops@example.com',
    amount: 220,
    queueMs: 1800,
    at: Date.now() - 420_000,
    events: [
      { at: '13:10', step: 'intake', ms: 11 },
      { at: '13:11', step: 'fraud', ms: 1800 },
    ],
  },
  {
    id: 'ORD-1024',
    status: 'ok',
    city: 'Braga',
    region: 'eu-west-1',
    owner: 'cs@example.com',
    amount: 89,
    queueMs: 0,
    at: Date.now() - 900_000,
    events: [
      { at: '12:00', step: 'intake', ms: 8 },
      { at: '12:00', step: 'settle', ms: 120 },
    ],
  },
  {
    id: 'ORD-1019',
    status: 'ok',
    city: 'Austin',
    region: 'us-east-1',
    owner: 'ops@example.com',
    amount: 4100,
    queueMs: 0,
    at: Date.now() - 1_200_000,
    events: [
      { at: '11:20', step: 'intake', ms: 14 },
      { at: '11:21', step: 'settle', ms: 95 },
    ],
  },
  {
    id: 'ORD-1012',
    status: 'processing',
    city: 'Mumbai',
    region: 'ap-south-1',
    owner: 'partner@example.com',
    amount: 760,
    queueMs: 950,
    at: Date.now() - 60_000,
    events: [
      { at: '14:01', step: 'intake', ms: 20 },
      { at: '14:01', step: 'fx', ms: 950 },
    ],
  },
  {
    id: 'ORD-1007',
    status: 'error',
    city: 'Newark',
    region: 'us-east-1',
    owner: 'billing@example.com',
    amount: 55,
    queueMs: 0,
    error: 'Card declined',
    at: Date.now() - 2_400_000,
    events: [{ at: '09:40', step: 'intake', ms: 7 }],
  },
  {
    id: 'ORD-1001',
    status: 'ok',
    city: 'Coimbra',
    region: 'eu-west-1',
    owner: 'cs@example.com',
    amount: 32,
    queueMs: 0,
    at: Date.now() - 3_600_000,
    events: [
      { at: '08:00', step: 'intake', ms: 6 },
      { at: '08:00', step: 'settle', ms: 80 },
    ],
  },
];

const STATUS_OPTS = [
  { value: '', label: 'All statuses' },
  { value: 'ok', label: 'ok' },
  { value: 'warn', label: 'warn' },
  { value: 'error', label: 'error' },
  { value: 'processing', label: 'processing' },
];

const REGION_OPTS = [
  { value: 'eu-west-1', label: 'eu-west-1' },
  { value: 'us-east-1', label: 'us-east-1' },
  { value: 'ap-south-1', label: 'ap-south-1' },
];

function statusColor(s: OrderStatus): string {
  if (s === 'ok') return 'emerald';
  if (s === 'warn') return 'amber';
  if (s === 'error') return 'red';
  return 'blue';
}

function relativeMins(ms: number, now: number): string {
  const mins = Math.max(0, Math.floor((now - ms) / 60_000));
  if (mins < 1) return 'just now';
  if (mins === 1) return '1m ago';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? '1h ago' : `${hrs}h ago`;
}

function matches(order: Order, q: string, status: string, regions: string[]): boolean {
  if (status && order.status !== status) return false;
  if (regions.length > 0 && !regions.includes(order.region)) return false;
  if (!q.trim()) return true;
  const hay = `${order.id} ${order.city} ${order.owner} ${order.error ?? ''}`.toLowerCase();
  return hay.includes(q.trim().toLowerCase());
}

ui.page('/examples/ops-console', () => {
  const live = ui.state({
    query: '',
    status: '' as string,
    regions: ['eu-west-1', 'us-east-1'] as string[],
    selectedId: 'ORD-1042',
    pinned: false,
    page: 1,
    pageSize: 5,
    clock: Date.now(),
    orders: SEED as Order[],
    banner: true,
  });

  ui.timer(30, () => {
    live.clock = Date.now();
  });

  exampleFrame(() => {
    ui.column({ gap: 3, className: 'w-full' }, () => {
      exampleHeader(
        undefined,
        'Dogfood master–detail: filterBar → feedList → descriptionList / staticTable. Fake orders data.',
      );

      ui.row({ gap: 2 }, () => {
        ui.link('Orders (state/auto)', '/examples/reactive-let-orders');
        ui.link('ReUI batch 7', '/examples/reui-batch-7');
        ui.link('ReUI batches 3–6', '/examples/reui-batches');
      });

      ui.auto(() => {
        if (!live.banner) return;
        ui.notice('Maintenance window 02:00–04:00 UTC — partner retries may lag.', {
          variant: 'warning',
          icon: 'triangle-alert',
          onDismiss: () => {
            live.banner = false;
          },
        });
      });

      // —— Filters (own auto so list/detail don’t remount the toolbar) ——
      ui.auto(() => {
        const chips = [
          ...(live.status
            ? [{ id: 'status', label: 'Status', value: live.status }]
            : []),
          ...(live.query.trim()
            ? [{ id: 'query', label: 'Search', value: live.query.trim() }]
            : []),
          ...live.regions.map((r) => ({ id: `region:${r}`, label: 'Region', value: r })),
        ];

        ui.filterBar(
          {
            chips,
            onRemoveChip: (id) => {
              if (id === 'status') live.status = '';
              else if (id === 'query') live.query = '';
              else if (id.startsWith('region:')) {
                const r = id.slice('region:'.length);
                live.regions = live.regions.filter((x) => x !== r);
              }
              live.page = 1;
            },
            onClear: () => {
              live.status = '';
              live.query = '';
              live.regions = [];
              live.page = 1;
            },
          },
          () => {
            ui.inputGroup({
              prefix: '⌕',
              placeholder: 'id, city, owner…',
              value: live.query,
              className: 'max-w-xs',
              onInput: (v) => {
                live.query = v;
                live.page = 1;
              },
            });
            ui.nativeSelect({
              options: STATUS_OPTS,
              value: live.status,
              className: 'w-[10rem]',
              onChange: (v) => {
                live.status = v;
                live.page = 1;
              },
            });
            ui.checkboxGroup({
              orientation: 'horizontal',
              value: live.regions,
              options: REGION_OPTS,
              onChange: (next) => {
                live.regions = next;
                live.page = 1;
              },
            });
            ui.toggle({
              icon: 'pin',
              text: 'Pin',
              pressed: live.pinned,
              variant: 'outline',
              size: 'sm',
              onPressedChange: (p) => {
                live.pinned = p;
              },
            });
          },
        );
      });

      ui.auto(() => {
        ui.label(
          () =>
            live.pinned
              ? 'Detail pane pinned — selection still updates content.'
              : 'Select a row · trailing time toggles absolute clock.',
        ).classes('text-xs text-muted-foreground');
      });

      ui.resizable(
        {
          orientation: 'horizontal',
          className: 'h-[calc(100vh-16rem)] min-h-[28rem] w-full rounded-md border',
        },
        (r) => {
          r.panel({ defaultSize: 42, minSize: 30 }, () => {
            ui.column({ gap: 2, className: 'flex h-full flex-col overflow-hidden p-2' }, () => {
              ui.auto(() => {
                const filtered = live.orders.filter((o) =>
                  matches(o, live.query, live.status, live.regions),
                );
                const pageCount = Math.max(1, Math.ceil(filtered.length / live.pageSize));
                const page = Math.min(live.page, pageCount);
                const slice = filtered.slice((page - 1) * live.pageSize, page * live.pageSize);

                ui.row({ gap: 2, className: 'items-center justify-between px-1' }, () => {
                  ui.label(() => `${filtered.length} order(s)`).classes(
                    'text-xs font-medium text-muted-foreground',
                  );
                  ui.pagination({
                    page,
                    pageCount,
                    onChange: (n) => {
                      live.page = n;
                    },
                  });
                });

                if (slice.length === 0) {
                  ui.empty({
                    title: 'No matching orders',
                    description: 'Clear filters or widen regions.',
                    icon: 'inbox',
                  });
                  return;
                }

                ui.feedList({ className: 'min-h-0 flex-1 overflow-auto' }, () => {
                  for (const order of slice) {
                    ui.feedRow(
                      {
                        selected: live.selectedId === order.id,
                        status: { color: statusColor(order.status) },
                        title: order.id,
                        meta: `${order.city} · ${order.region}`,
                        issue: order.error,
                        marker: order.isNew ? 'new' : undefined,
                        trailing: () => relativeMins(order.at, live.clock),
                        onClick: () => {
                          live.selectedId = order.id;
                        },
                      },
                      () => {
                        ui.badge(order.status, {
                          size: 'xs',
                          color: statusColor(order.status),
                        });
                        if (order.queueMs > 0) {
                          ui.badge(`${order.queueMs}ms lag`, {
                            size: 'xs',
                            variant: 'outline',
                          });
                        }
                      },
                    );
                  }
                });
              });
            });
          });

          r.panel({ defaultSize: 58, minSize: 36 }, () => {
            ui.column({ gap: 3, className: 'h-full overflow-auto p-4' }, () => {
              ui.auto(() => {
                const order = live.orders.find((o) => o.id === live.selectedId);
                if (!order) {
                  ui.empty({
                    title: 'Select an order',
                    description: 'Pick a row from the intake feed.',
                    icon: 'mouse-pointer-click',
                  });
                  return;
                }

                ui.row({ gap: 2, className: 'items-center flex-wrap' }, () => {
                  ui.label(order.id).classes('text-xl font-semibold tabular-nums');
                  ui.badge(order.status, {
                    size: 'xs',
                    color: statusColor(order.status),
                  });
                  ui.copyButton(order.id, { label: 'Copy id', size: 'sm' });
                });

                if (order.error) {
                  ui.notice(order.error, {
                    variant: 'destructive',
                    icon: 'circle-x',
                    dismissible: false,
                  });
                }

                ui.descriptionList({
                  horizontal: true,
                  items: [
                    { term: 'Owner', detail: order.owner },
                    { term: 'City', detail: order.city },
                    { term: 'Region', detail: order.region },
                    { term: 'Amount', detail: `$${order.amount.toLocaleString()}` },
                    {
                      term: 'Updated',
                      detail: relativeMins(order.at, live.clock),
                    },
                  ],
                });

                ui.separator();

                ui.label('Pipeline').classes('text-sm font-medium');
                ui.staticTable({
                  striped: true,
                  density: 'compact',
                  columns: [
                    { key: 'at', label: 'Time', mono: true },
                    { key: 'step', label: 'Step' },
                    { key: 'ms', label: 'ms', align: 'right' },
                  ],
                  rows: order.events.map((e) => ({
                    at: e.at,
                    step: e.step,
                    ms: e.ms,
                  })),
                  emptyTitle: 'No events',
                });

                ui.row({ gap: 2 }, () => {
                  ui.button('Retry', {
                    size: 'sm',
                    variant: 'outline',
                    disabled: order.status === 'ok',
                    onClick: () => ui.notify(`Retry queued for ${order.id}`, 'info'),
                  });
                  ui.button('Open runbook', {
                    size: 'sm',
                    variant: 'ghost',
                    onClick: () => ui.notify('Runbook would open externally', 'info'),
                  });
                });
              });
            });
          });
        },
      );
    });
  });
});
