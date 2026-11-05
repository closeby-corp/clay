import { ui } from '@close-by/clay';
import { exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Live charts',
  icon: 'activity',
  order: 32,
  group: 'Data',
  groupIcon: 'table',
};

const WINDOW = 40;
const REGIONS = ['EU', 'US', 'APAC', 'LATAM', 'MEA'];
const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Other'];

const clock = (d: Date) => d.toTimeString().slice(0, 8);
const wobble = (v: number, spread: number, min = 0) =>
  Math.max(min, Math.round(v + (Math.random() - 0.5) * spread));
/** Random walk that drifts back toward `base`, so values don't run off to a bound. */
const drift = (v: number, base: number, spread: number, min = 0) =>
  wobble(v + (base - v) * 0.15, spread, min);

ui.page('/examples/live-charts', () => {
  /** Per-session tick callbacks, driven by one timer. */
  const timers: Array<() => void> = [];
  // Rolling window of request latency, one point per tick.
  let p50 = 120;
  let p95 = 260;
  const now = Date.now();
  const latencySeed = Array.from({ length: WINDOW }, (_, i) => {
    p50 = drift(p50, 120, 24, 40);
    p95 = Math.max(p50 + 40, drift(p95, 260, 50));
    return { t: clock(new Date(now - (WINDOW - i) * 1000)), p50, p95 };
  });

  let regions = REGIONS.map((region) => ({ region, orders: wobble(400, 300, 50) }));
  let browsers = BROWSERS.map((browser, i) => ({ browser, visitors: 300 - i * 50 }));
  let cpu = 42;
  let tick = 0;

  ui.column(() => {
    exampleHeader(
      undefined,
      'Every chart below updates in place on a timer. Streams use appendData (only new points go over the wire); snapshots use setData so bars and slices tween to their new values.',
    );

    exampleSection('Streaming window', 'chart.appendData(point, { max: 40 }) — once a second, the oldest point drops off.');
    const latency = ui.lineChart({
      title: 'Request latency',
      description: 'Milliseconds, last 40 s',
      data: latencySeed,
      xKey: 't',
      series: [
        { key: 'p50', label: 'p50', color: 'var(--chart-1)' },
        { key: 'p95', label: 'p95', color: 'var(--chart-4)' },
      ],
      height: 240,
      headline: { value: `${p50} ms`, trend: 'p50', trendDirection: 'down' },
    });

    ui.grid({ minColWidth: '18rem', gap: 4 }, () => {
      const rps = ui.sparkline({
        title: 'Requests / s',
        value: '0',
        data: latencySeed.map((r) => ({ t: r.t, rps: wobble(900, 200) })),
        xKey: 't',
        yKey: 'rps',
      });
      const errors = ui.sparkline({
        title: 'Error rate',
        value: '0.4%',
        type: 'line',
        color: 'var(--destructive)',
        data: latencySeed.map((r) => ({ t: r.t, rate: Math.random() * 0.8 })),
        xKey: 't',
        yKey: 'rate',
      });
      const gauge = ui.radialChart({
        title: 'CPU',
        data: [{ name: 'cpu', value: cpu, fill: 'var(--chart-2)' }],
        nameKey: 'name',
        valueKey: 'value',
        startAngle: 90,
        endAngle: 90 - (360 * cpu) / 100,
        innerRadius: 70,
        outerRadius: 100,
        height: 200,
        centerValue: `${cpu}%`,
        centerLabel: 'utilisation',
      });

      timers.push(() => {
        const t = clock(new Date());
        const r = wobble(900, 260);
        rps.appendData({ t, rps: r }, { max: WINDOW });
        rps.setHeadline({ value: r.toLocaleString() });
        const rate = Math.random() * 0.8 + (tick % 15 === 0 ? 2 : 0);
        errors.appendData({ t, rate }, { max: WINDOW });
        errors.setHeadline({
          value: `${rate.toFixed(1)}%`,
          trend: rate > 1 ? 'spike' : 'normal',
          trendDirection: rate > 1 ? 'up' : 'down',
        });
        cpu = Math.min(98, drift(cpu, 45, 14, 5));
        gauge.update({
          data: [{ name: 'cpu', value: cpu, fill: cpu > 80 ? 'var(--destructive)' : 'var(--chart-2)' }],
          endAngle: 90 - (360 * cpu) / 100,
          centerValue: `${cpu}%`,
        });
      });
    });

    exampleSection('KPI cards', 'ui.stat(...).updateItem(title, patch) and appendSparkline(title, point, { max }) — one card changes, the rest stay put.');
    let mrr = 48_200;
    let sessions = 300;
    const kpis = ui.stat([
      {
        title: 'MRR',
        value: `$${mrr.toLocaleString()}`,
        trend: '+2.1%',
        sparkline: { data: latencySeed.map((r, i) => ({ t: r.t, v: mrr - 47_000 - (WINDOW - i) * 15 })), xKey: 't', yKey: 'v' },
      },
      { title: 'Active sessions', value: sessions, description: 'Right now' },
      { title: 'Deploys today', value: 7, footer: 'Last one 12 min ago' },
    ]);
    timers.push(() => {
      mrr = drift(mrr, 48_500, 300, 40_000);
      kpis.appendSparkline('MRR', { t: clock(new Date()), v: mrr - 47_000 }, { max: WINDOW });
      kpis.updateItem('MRR', { value: `$${mrr.toLocaleString()}` });
      sessions = drift(sessions, 320, 40, 50);
      kpis.updateItem('Active sessions', { value: sessions });
    });

    exampleSection('Snapshots', 'chart.setData(rows) every 2 s — same rows, new values, so the marks tween instead of redrawing.');
    ui.grid({ minColWidth: '20rem', gap: 4 }, () => {
      const bars = ui.barChart({
        title: 'Orders by region',
        description: 'Rolling 5 min',
        data: regions,
        xKey: 'region',
        series: [{ key: 'orders', label: 'Orders', color: 'var(--chart-1)' }],
        height: 240,
        showLegend: false,
      });
      const pie = ui.pieChart({
        title: 'Live visitors by browser',
        data: browsers,
        nameKey: 'browser',
        valueKey: 'visitors',
        innerRadius: 60,
        height: 240,
      });
      timers.push(() => {
        if (tick % 2 !== 0) return;
        regions = regions.map((r) => ({ ...r, orders: wobble(r.orders, 160, 20) }));
        bars.setData(regions);
        browsers = browsers.map((b) => ({ ...b, visitors: wobble(b.visitors, 60, 10) }));
        pie.setData(browsers);
      });
    });

    exampleSection('Growing bucket', 'chart.upsertData(row) — the current minute keeps updating; a new minute appends.');
    let minuteCount = 0;
    const minuteKey = () => new Date().toTimeString().slice(0, 5);
    const perMinute = ui.areaChart({
      title: 'Signups per minute',
      data: Array.from({ length: 12 }, (_, i) => ({
        minute: new Date(Date.now() - (12 - i) * 60_000).toTimeString().slice(0, 5),
        signups: wobble(30, 30, 5),
      })),
      xKey: 'minute',
      series: [{ key: 'signups', label: 'Signups', color: 'var(--chart-3)' }],
      height: 200,
      showLegend: false,
    });
    let currentMinute = minuteKey();
    timers.push(() => {
      const m = minuteKey();
      if (m !== currentMinute) {
        currentMinute = m;
        minuteCount = 0;
      }
      minuteCount += Math.floor(Math.random() * 4);
      perMinute.upsertData({ minute: m, signups: minuteCount }, { max: 30 });
    });

    timers.push(() => {
      p50 = drift(p50, 120, 24, 40);
      p95 = Math.max(p50 + 40, drift(p95, 260, 50));
      latency.appendData({ t: clock(new Date()), p50, p95 }, { max: WINDOW });
      latency.setHeadline({ value: `${p50} ms`, trend: `p95 ${p95} ms`, trendDirection: p95 > 320 ? 'up' : 'down' });
    });
  }, { gap: 6 });

  ui.timer(1, () => {
    tick += 1;
    for (const fn of timers) fn();
  });
});

