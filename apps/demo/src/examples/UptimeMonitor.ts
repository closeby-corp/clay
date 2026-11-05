import { ui } from '@close-by/clay';
import type { DataTableElement, LngLat, MapMarkerDatum } from '@close-by/clay';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Uptime monitor',
  icon: 'activity',
  order: 41,
  group: 'Maps',
  groupIcon: 'map',
};

type Health = 'healthy' | 'degraded' | 'down';

type Region = {
  id: string;
  region: string;
  lngLat: LngLat;
  baseLatency: number;
  baseUptime: number;
  health: Health;
  /** Display text for `health`. The table column reads this. */
  status: string;
  /** ms */
  latency: number;
  /** Fraction, formatted as a percent by the table. */
  uptime: number;
  lastCheck: string;
};

const LABEL: Record<Health, string> = { healthy: 'Healthy', degraded: 'Degraded', down: 'Down' };
const TONE: Record<Health, string> = { healthy: 'chart-3', degraded: 'chart-4', down: 'destructive' };
const TIMEOUT_MS = 3000;

const EDGE_LOCATIONS: Array<Pick<Region, 'id' | 'region' | 'lngLat' | 'baseLatency' | 'baseUptime'>> = [
  { id: 'iad', region: 'N. Virginia', lngLat: [-77.45, 38.95], baseLatency: 28, baseUptime: 0.9998 },
  { id: 'ord', region: 'Chicago', lngLat: [-87.63, 41.88], baseLatency: 34, baseUptime: 0.9996 },
  { id: 'dfw', region: 'Dallas', lngLat: [-96.8, 32.78], baseLatency: 41, baseUptime: 0.9994 },
  { id: 'sea', region: 'Seattle', lngLat: [-122.33, 47.61], baseLatency: 45, baseUptime: 0.9997 },
  { id: 'sjc', region: 'San Jose', lngLat: [-121.89, 37.34], baseLatency: 52, baseUptime: 0.9995 },
  { id: 'gru', region: 'São Paulo', lngLat: [-46.63, -23.55], baseLatency: 118, baseUptime: 0.9991 },
  { id: 'dub', region: 'Dublin', lngLat: [-6.26, 53.35], baseLatency: 72, baseUptime: 0.9996 },
  { id: 'lhr', region: 'London', lngLat: [-0.13, 51.51], baseLatency: 68, baseUptime: 0.9998 },
  { id: 'cdg', region: 'Paris', lngLat: [2.35, 48.86], baseLatency: 74, baseUptime: 0.9993 },
  { id: 'fra', region: 'Frankfurt', lngLat: [8.68, 50.11], baseLatency: 70, baseUptime: 0.9997 },
  { id: 'jnb', region: 'Johannesburg', lngLat: [28.05, -26.2], baseLatency: 182, baseUptime: 0.999 },
  { id: 'bom', region: 'Mumbai', lngLat: [72.88, 19.08], baseLatency: 136, baseUptime: 0.9992 },
  { id: 'sin', region: 'Singapore', lngLat: [103.82, 1.35], baseLatency: 96, baseUptime: 0.9996 },
  { id: 'hkg', region: 'Hong Kong', lngLat: [114.17, 22.32], baseLatency: 88, baseUptime: 0.9994 },
  { id: 'nrt', region: 'Tokyo', lngLat: [139.69, 35.69], baseLatency: 102, baseUptime: 0.9997 },
  { id: 'syd', region: 'Sydney', lngLat: [151.21, -33.87], baseLatency: 148, baseUptime: 0.9993 },
];

const nextHealth = (h: Health): Health => {
  const r = Math.random();
  if (h === 'healthy') return r < 0.08 ? 'degraded' : h;
  if (h === 'degraded') return r < 0.3 ? 'down' : r < 0.6 ? 'healthy' : h;
  return r < 0.4 ? 'degraded' : h;
};

const markerFor = (r: Region): MapMarkerDatum => ({
  id: r.id,
  lngLat: r.lngLat,
  tone: TONE[r.health],
  pulse: r.health !== 'healthy',
  size: 'sm',
  tooltip: `${r.region} · ${r.latency} ms · ${LABEL[r.health]}`,
});

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

ui.page('/examples/uptime', () => {
  const now0 = new Date().toISOString();
  const rows: Region[] = EDGE_LOCATIONS.map((e) => ({
    ...e,
    health: 'healthy',
    status: LABEL.healthy,
    latency: e.baseLatency,
    uptime: e.baseUptime,
    lastCheck: now0,
  }));
  let incidents = 3;

  let globe!: ReturnType<typeof ui.map>;
  let table!: DataTableElement;
  let statUptime!: ReturnType<typeof ui.label>;
  let statLatency!: ReturnType<typeof ui.label>;
  let statHealthy!: ReturnType<typeof ui.label>;
  let statIncidents!: ReturnType<typeof ui.label>;

  const renderStats = () => {
    const up = rows.filter((r) => r.health !== 'down');
    const healthy = rows.filter((r) => r.health === 'healthy').length;
    statUptime.setText(`${(mean(rows.map((r) => r.uptime)) * 100).toFixed(2)}%`);
    statLatency.setText(String(Math.round(mean(up.map((r) => r.latency)))));
    statHealthy.setText(`${healthy} / ${rows.length}`);
    statIncidents.setText(String(incidents));
  };

  // One tick every 2s: one region may change state, four regions get fresh checks.
  // Only the regions that changed get new row objects, so only those flash in the table.
  const tick = () => {
    const now = new Date().toISOString();
    const pivot = Math.floor(Math.random() * rows.length);
    const touched = new Set<number>([pivot]);
    while (touched.size < 4) touched.add(Math.floor(Math.random() * rows.length));

    for (const i of touched) {
      const r = rows[i]!;
      const health = i === pivot ? nextHealth(r.health) : r.health;
      if (r.health === 'healthy' && health !== 'healthy') incidents += 1;
      const latency =
        health === 'down'
          ? TIMEOUT_MS
          : Math.round(r.baseLatency * (health === 'degraded' ? 2.4 : 1) * (0.85 + Math.random() * 0.3));
      const uptime =
        health === 'down' ? Math.max(0.9, r.uptime - 0.001) : Math.min(r.baseUptime, r.uptime + 0.0002);
      rows[i] = { ...r, health, status: LABEL[health], latency, uptime, lastCheck: now };
    }

    table.setRows([...rows]);
    globe.setMarkers(rows.map(markerFor));
    renderStats();
  };

  exampleFrame(() => {
      ui.column(() => {
        exampleHeader(
          undefined,
          'Status page for edge locations. Probes run every 2s. Regions flip between healthy, degraded and down.',
        );

        ui.grid({ minColWidth: '10rem', gap: 3 }, () => {
          const stat = (title: string, initial: string) => {
            let value!: ReturnType<typeof ui.label>;
            ui.card({ gap: 1, className: 'py-4' }, () => {
              ui.label(title).classes('text-sm text-muted-foreground');
              value = ui.label(initial).classes('text-2xl font-bold tabular-nums');
            });
            return value;
          };
          statUptime = stat('Global uptime', '0.00%');
          statLatency = stat('Avg latency (ms)', '0');
          statHealthy = stat('Healthy regions', `0 / ${rows.length}`);
          statIncidents = stat('Incidents 24h', '0');
        });

        ui.card({ title: 'Edge locations', description: 'Marker colour shows health. Pulsing markers are degraded or down.', gap: 3 }, () => {
          globe = ui.map({
            center: [10, 20],
            zoom: 1.2,
            height: '22rem',
            controls: false,
            markers: rows.map(markerFor),
          });
        });

        ui.card({ title: 'Regions', description: 'Latest probe results per region.', gap: 3 }, () => {
          table = ui.dataTable(rows, {
            keyField: 'id',
            highlightChanges: true,
            fill: false,
            maxHeight: '28rem',
            stackOnMobile: true,
            columnToggle: false,
            exportable: false,
            columns: [
              { key: 'region', header: 'Region' },
              { key: 'status', header: 'Status' },
              { key: 'latency', header: 'Latency (ms)', format: 'number' },
              { key: 'uptime', header: 'Uptime', format: 'percent', formatOptions: { decimals: 2 } },
              { key: 'lastCheck', header: 'Last check', format: 'relative' },
            ],
          });
        });
      }, { gap: 6 });
  });

  renderStats();
  ui.timer(2, tick);
});
