import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Delivery tracker',
  icon: 'truck',
  order: 38,
  group: 'Maps',
  groupIcon: 'map',
};

type LngLat = [number, number];

// Hand-placed path: Tasca do Cais (Cais do Sodré) to Rua Ferreira Borges (Campo de Ourique).
const ROUTE: LngLat[] = [
  [-9.1450, 38.7068],
  [-9.1456, 38.7085],
  [-9.1462, 38.7102],
  [-9.1468, 38.7120],
  [-9.1475, 38.7138],
  [-9.1481, 38.7155],
  [-9.1488, 38.7172],
  [-9.1494, 38.7190],
  [-9.1500, 38.7208],
  [-9.1508, 38.7226],
  [-9.1518, 38.7241],
  [-9.1532, 38.7252],
  [-9.1548, 38.7258],
  [-9.1566, 38.7254],
  [-9.1582, 38.7244],
  [-9.1598, 38.7232],
  [-9.1610, 38.7220],
  [-9.1622, 38.7208],
  [-9.1632, 38.7196],
  [-9.1640, 38.7184],
  [-9.1648, 38.7176],
  [-9.1656, 38.7170],
  [-9.1666, 38.7165],
  [-9.1676, 38.7162],
  [-9.1684, 38.7160],
];

const ROUTE_ID = 'delivery-route';
const ETA_MINUTES = 22;
const TICK_SECONDS = 0.25;
/** Fraction of the route covered per tick (about 42 s end to end). */
const STEP = 0.006;
/** Ticks spent in "Preparing" before the courier leaves (about 4 s). */
const WARMUP_TICKS = 16;

const STAGES = ['Preparing', 'Picked up', 'On the way', 'Delivered'];
const STAGE_COPY = [
  'Kitchen confirmed the order',
  'Courier collected the bag',
  'Riding through Chiado and Avenida da Liberdade',
  'Left at the door',
];

function distanceKm(a: LngLat, b: LngLat): number {
  const midLat = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  const dx = (b[0] - a[0]) * Math.cos(midLat) * 111.32;
  const dy = (b[1] - a[1]) * 110.57;
  return Math.hypot(dx, dy);
}

const CUMULATIVE_KM: number[] = [0];
for (let i = 1; i < ROUTE.length; i++) {
  CUMULATIVE_KM.push(CUMULATIVE_KM[i - 1]! + distanceKm(ROUTE[i - 1]!, ROUTE[i]!));
}
const ROUTE_KM = CUMULATIVE_KM[CUMULATIVE_KM.length - 1]!;

/** Point at `progress` (0..1) of the route length, interpolated along its segments. */
function pointAt(progress: number): LngLat {
  const target = Math.min(1, Math.max(0, progress)) * ROUTE_KM;
  let i = 1;
  while (i < ROUTE.length - 1 && CUMULATIVE_KM[i]! < target) i++;
  const a = ROUTE[i - 1]!;
  const b = ROUTE[i]!;
  const span = CUMULATIVE_KM[i]! - CUMULATIVE_KM[i - 1]! || 1;
  const t = (target - CUMULATIVE_KM[i - 1]!) / span;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

const ROUTE_BOUNDS: [LngLat, LngLat] = [
  [Math.min(...ROUTE.map((p) => p[0])), Math.min(...ROUTE.map((p) => p[1]))],
  [Math.max(...ROUTE.map((p) => p[0])), Math.max(...ROUTE.map((p) => p[1]))],
];

ui.page('/examples/delivery-tracker', () => {
  let progress = 0;
  let warmup = 0;
  let paused = false;

  let statusBadge!: ReturnType<typeof ui.badge>;
  let etaLabel!: ReturnType<typeof ui.label>;
  let pctLabel!: ReturnType<typeof ui.label>;
  let bar!: ReturnType<typeof ui.progress>;
  let steps!: ReturnType<typeof ui.timeline>;
  let pauseBtn!: ReturnType<typeof ui.button>;
  let map!: ReturnType<typeof ui.map>;

  const stageIndex = (): number => {
    if (progress >= 1) return 3;
    if (progress >= 0.1) return 2;
    if (progress > 0) return 1;
    return 0;
  };

  /** Push the current progress into every element. Each setter patches only its own prop. */
  const render = () => {
    const stage = stageIndex();
    const done = progress >= 1;
    const pct = Math.round(progress * 100);

    statusBadge.setText(STAGES[stage]!);
    etaLabel.setText(done ? 'Arrived' : `${Math.max(1, Math.ceil((1 - progress) * ETA_MINUTES))} min`);
    pctLabel.setText(`${pct}% of route`);
    bar.setValue(pct);
    steps.update({
      items: STAGES.map((title, i) => ({
        title,
        description: STAGE_COPY[i],
        status: i < stage || done ? 'completed' : i === stage ? 'active' : 'pending',
      })),
    });

    map.updateRoute(ROUTE_ID, { progress });
    map.upsertMarker({
      id: 'courier',
      lngLat: pointAt(progress),
      tone: 'primary',
      icon: 'bike',
      pulse: true,
      tooltip: 'Ines Martins · EB-204',
    });

    pauseBtn.setText(done ? 'Delivered' : paused ? 'Resume' : 'Pause');
    pauseBtn.update({ disabled: done });
  };

  const tick = () => {
    if (progress === 0 && warmup < WARMUP_TICKS) {
      warmup += 1;
      render();
      return;
    }
    progress = Math.min(1, progress + STEP);
    render();
    if (progress >= 1) {
      timer.deactivate();
      ui.notify('Order #4821 delivered', 'success');
    }
  };

  exampleFrame(() => {
    ui.column({ fillViewport: true, gap: 4 }, () => {
      exampleHeader(
        undefined,
        'ui.column({ fillViewport }) + grow — the panels fill the page. The courier moves along the route with in-place updates (updateRoute / upsertMarker / setValue).',
      );

      ui.row({ grow: true, wrap: false, gap: 4, className: 'max-md:flex-col' }, () => {
        ui.card(
          {
            title: 'Order #4821',
            description: 'Tasca do Cais → Campo de Ourique',
            scroll: true,
            gap: 4,
            className: 'md:w-80 md:shrink-0',
          },
          () => {
            ui.row(
              () => {
                statusBadge = ui.badge('Preparing');
                ui.column(
                  () => {
                    ui.label('ETA').classes('text-xs text-muted-foreground');
                    etaLabel = ui.label('22 min').classes('text-lg font-semibold tabular-nums');
                  },
                  { gap: 0, align: 'end' },
                );
              },
              { justify: 'between', align: 'center', wrap: false },
            );

            ui.column(
              () => {
                bar = ui.progress({ value: 0 });
                pctLabel = ui.label('0% of route').classes('text-xs text-muted-foreground');
              },
              { gap: 1 },
            );

            ui.row(
              () => {
                ui.avatar({ fallback: 'IM' });
                ui.column(
                  () => {
                    ui.label('Ines Martins').classes('font-medium');
                    ui.label('Electric bike · EB-204').classes('text-xs text-muted-foreground');
                  },
                  { gap: 0 },
                );
              },
              { gap: 3, align: 'center', wrap: false },
            );

            steps = ui.timeline({ items: [] });

            ui.row(
              () => {
                pauseBtn = ui.button('Pause', {
                  variant: 'outline',
                  size: 'sm',
                  onClick: () => {
                    if (progress >= 1) return;
                    paused = !paused;
                    if (paused) timer.deactivate();
                    else timer.activate();
                    render();
                  },
                });
                ui.button('Restart', {
                  variant: 'ghost',
                  size: 'sm',
                  onClick: () => {
                    progress = 0;
                    warmup = 0;
                    paused = false;
                    timer.activate();
                    render();
                  },
                });
              },
              { gap: 2, wrap: false },
            );
          },
        );

        ui.column({ grow: true, gap: 2 }, () => {
          map = ui.map({
            fill: true,
            controls: { zoom: true, compass: false, position: 'top-right' },
            markers: [
              {
                id: 'restaurant',
                lngLat: ROUTE[0]!,
                tone: 'chart-2',
                icon: 'utensils',
                label: 'Tasca do Cais',
                tooltip: 'Restaurant',
              },
              {
                id: 'customer',
                lngLat: ROUTE[ROUTE.length - 1]!,
                tone: 'primary',
                icon: 'home',
                label: 'Customer',
                tooltip: 'Rua Ferreira Borges 12',
              },
            ],
            routes: [
              {
                id: ROUTE_ID,
                coordinates: ROUTE,
                tone: 'foreground',
                width: 4,
                opacity: 0.7,
                progress: 0,
                // The courier is our own pulsing marker (upsertMarker), and the
                // restaurant/customer pins mark the ends.
                progressMarker: false,
              },
            ],
          });
        });
      });
    });
  });

  map.fitBounds(ROUTE_BOUNDS, { padding: 48 });
  render();
  const timer = ui.timer(TICK_SECONDS, tick);
});
