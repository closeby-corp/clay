import { ui } from '@close-by/clay';
import type { LngLat, MapArcGroup, MapMarkerDatum, MapTone } from '@close-by/clay';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Community globe',
  icon: 'globe',
  order: 40,
  group: 'Maps',
  groupIcon: 'map',
};

type Area = 'americas' | 'europe' | 'asia' | 'oceania';

type Member = {
  id: string;
  name: string;
  initials: string;
  city: string;
  /** Hours from UTC, as of early November (standard time everywhere that observes DST). */
  utcOffset: number;
  lngLat: LngLat;
  area: Area;
};

const HOUR_MS = 3_600_000;
const ME: LngLat = [-9.14, 38.72]; // Lisbon
const AREA_TONE: Record<Area, MapTone> = {
  americas: 'chart-1',
  europe: 'chart-2',
  asia: 'chart-3',
  oceania: 'chart-4',
};

const members: Member[] = [
  { id: 'm01', name: 'Ana Souza', initials: 'AS', city: 'São Paulo', utcOffset: -3, lngLat: [-46.63, -23.55], area: 'americas' },
  { id: 'm02', name: 'Mateo Ruiz', initials: 'MR', city: 'Mexico City', utcOffset: -6, lngLat: [-99.13, 19.43], area: 'americas' },
  { id: 'm03', name: 'Hannah Brooks', initials: 'HB', city: 'New York', utcOffset: -5, lngLat: [-74.01, 40.71], area: 'americas' },
  { id: 'm04', name: "Liam O'Connor", initials: 'LO', city: 'Vancouver', utcOffset: -8, lngLat: [-123.12, 49.28], area: 'americas' },
  { id: 'm05', name: 'Lucía Fernández', initials: 'LF', city: 'Buenos Aires', utcOffset: -3, lngLat: [-58.38, -34.6], area: 'americas' },
  { id: 'm06', name: 'Jonas Weber', initials: 'JW', city: 'Berlin', utcOffset: 1, lngLat: [13.4, 52.52], area: 'europe' },
  { id: 'm07', name: 'Amélie Dubois', initials: 'AD', city: 'Paris', utcOffset: 1, lngLat: [2.35, 48.86], area: 'europe' },
  { id: 'm08', name: 'Ngozi Okafor', initials: 'NO', city: 'Lagos', utcOffset: 1, lngLat: [3.38, 6.52], area: 'europe' },
  { id: 'm09', name: 'Elif Yıldız', initials: 'EY', city: 'Istanbul', utcOffset: 3, lngLat: [28.98, 41.01], area: 'europe' },
  { id: 'm10', name: 'Kwame Mensah', initials: 'KM', city: 'Accra', utcOffset: 0, lngLat: [-0.19, 5.6], area: 'europe' },
  { id: 'm11', name: 'Ivan Petrov', initials: 'IP', city: 'Nairobi', utcOffset: 3, lngLat: [36.82, -1.29], area: 'europe' },
  { id: 'm12', name: 'Olga Novak', initials: 'ON', city: 'Moscow', utcOffset: 3, lngLat: [37.62, 55.76], area: 'europe' },
  { id: 'm13', name: 'Yuki Tanaka', initials: 'YT', city: 'Tokyo', utcOffset: 9, lngLat: [139.69, 35.69], area: 'asia' },
  { id: 'm14', name: 'Priya Raman', initials: 'PR', city: 'Bengaluru', utcOffset: 5.5, lngLat: [77.59, 12.97], area: 'asia' },
  { id: 'm15', name: 'Wei Zhang', initials: 'WZ', city: 'Shanghai', utcOffset: 8, lngLat: [121.47, 31.23], area: 'asia' },
  { id: 'm16', name: 'Min-jun Park', initials: 'MP', city: 'Seoul', utcOffset: 9, lngLat: [126.98, 37.57], area: 'asia' },
  { id: 'm17', name: 'Nadia Rahman', initials: 'NR', city: 'Dubai', utcOffset: 4, lngLat: [55.27, 25.2], area: 'asia' },
  { id: 'm18', name: 'Rohan Mehta', initials: 'RM', city: 'Singapore', utcOffset: 8, lngLat: [103.82, 1.35], area: 'asia' },
  { id: 'm19', name: 'Chloe Walsh', initials: 'CW', city: 'Sydney', utcOffset: 11, lngLat: [151.21, -33.87], area: 'oceania' },
  { id: 'm20', name: 'Tane Ngata', initials: 'TN', city: 'Auckland', utcOffset: 13, lngLat: [174.76, -36.85], area: 'oceania' },
];

const localDate = (m: Member, now: number) => new Date(now + m.utcOffset * HOUR_MS);

const clock = (d: Date) =>
  `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;

/** Awake between 07:00 and 23:00 local time. */
const isAwake = (m: Member, now: number) => {
  const h = localDate(m, now).getUTCHours();
  return h >= 7 && h < 23;
};

const markerFor = (m: Member, now: number): MapMarkerDatum => ({
  id: m.id,
  lngLat: m.lngLat,
  tone: AREA_TONE[m.area],
  label: m.initials,
  size: 'sm',
  tooltip: `${m.name} · ${m.city} · ${clock(localDate(m, now))}`,
});

const arcsFor = (now: number): MapArcGroup[] => [
  {
    id: 'awake',
    tone: 'chart-2',
    width: 1.5,
    curvature: 0.3,
    data: members
      .filter((m) => isAwake(m, now))
      .map((m) => ({ id: m.id, from: ME, to: m.lngLat, label: `Lisbon → ${m.city}` })),
  },
];

ui.page('/examples/globe', () => {
  const state = ui.state({ filter: 'all' as 'all' | 'awake', awakeKey: '' });
  let globe!: ReturnType<typeof ui.map>;
  const timeLabels = new Map<string, ReturnType<typeof ui.label>>();

  const awakeKey = (now: number) => members.filter((m) => isAwake(m, now)).map((m) => m.id).join(',');

  // Markers and arcs for the current filter and time.
  const syncMap = () => {
    const now = Date.now();
    const shown = members.filter((m) => state.filter === 'all' || isAwake(m, now));
    const you: MapMarkerDatum = {
      id: 'you',
      lngLat: ME,
      tone: 'foreground',
      label: 'LX',
      size: 'sm',
      tooltip: 'You · Lisbon',
    };
    globe.setMarkers([you, ...shown.map((m) => markerFor(m, now))]);
    globe.setArcs(arcsFor(now));
  };

  const setFilter = (next: 'all' | 'awake') => {
    if (state.filter === next) return;
    state.filter = next;
    syncMap();
  };

  const renderToggle = () => {
    ui.row(() => {
      for (const [value, text] of [
        ['all', 'All'],
        ['awake', 'Awake now'],
      ] as const) {
        ui.button(text, {
          size: 'sm',
          variant: state.filter === value ? 'default' : 'outline',
          onClick: () => setFilter(value),
        });
      }
    }, { gap: 2 });
  };

  const renderList = () => {
    state.awakeKey;
    timeLabels.clear();
    const now = Date.now();
    const shown = members.filter((m) => state.filter === 'all' || isAwake(m, now));
    if (shown.length === 0) {
      ui.label('Nobody is awake right now.').classes('text-sm text-muted-foreground');
      return;
    }
    for (const m of shown) {
      const awake = isAwake(m, now);
      ui.column(() => {
        ui.button(m.name, {
          variant: 'ghost',
          size: 'sm',
          className: 'h-auto w-full justify-start px-2 py-1 font-medium',
          onClick: () => {
            globe.flyTo(m.lngLat, 4);
          },
        });
        ui.row(() => {
          ui.label(m.city).classes('min-w-0 truncate text-xs text-muted-foreground');
          timeLabels.set(m.id, ui.label(clock(localDate(m, now))).classes('text-xs tabular-nums text-muted-foreground'));
          ui.badge(awake ? 'Awake' : 'Asleep', { variant: awake ? 'default' : 'secondary' });
        }, { gap: 2, wrap: false, minWidthZero: true, className: 'items-center px-2 pb-1.5' });
      }, { gap: 0 });
    }
  };

  // Called every 30s. Times update in place. The list re-renders only when someone changes awake state.
  const tick = () => {
    const now = Date.now();
    for (const m of members) timeLabels.get(m.id)?.setText(clock(localDate(m, now)));
    const key = awakeKey(now);
    if (key !== state.awakeKey) {
      state.awakeKey = key;
    }
    syncMap();
  };

  exampleFrame(() => {
    ui.column({ fillViewport: true, gap: 4 }, () => {
      exampleHeader(
        undefined,
        'Where the community is working from right now. Local times refresh every 30s. Arcs show who is awake, measured from Lisbon.',
      );

      ui.row({ grow: true, gap: 4, wrap: false, className: 'max-md:flex-col' }, () => {
        ui.column({ gap: 2, className: 'min-h-0 md:w-80 md:shrink-0' }, () => {
          ui.auto(renderToggle);
          ui.card({ title: 'Members', description: 'Click a name to fly there.', scroll: true, grow: true, gap: 1 }, () => {
            ui.auto(renderList);
          });
        });

        ui.column({ grow: true, gap: 2 }, () => {
          globe = ui.map({
            projection: 'globe',
            center: [10, 20],
            zoom: 1.6,
            fill: true,
            controls: { zoom: true, compass: true, position: 'top-right' },
          });
        });
      });
    });
  });

  syncMap();
  state.awakeKey = awakeKey(Date.now());
  ui.timer(30, tick);
});
