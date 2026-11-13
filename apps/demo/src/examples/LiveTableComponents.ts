import { ui } from '@close-by/clay';
import type { DataTableElement } from '@close-by/clay';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Live table components',
  icon: 'activity',
  order: 36,
  group: 'Data',
  groupIcon: 'table',
};

type Row = {
  id: string;
  symbol: string;
  price: number;
  change: number;
  volume: number;
  history: number[];
  load: number;
};

const makeRows = (n: number): Row[] => {
  return Array.from({ length: n }, (_, i) => {
    const history = [Math.round((20 + Math.random() * 480) * 100) / 100];
    for (let j = 1; j < 30; j++) {
      history.push(Math.round(Math.max(0.01, history[j - 1]! * (1 + (Math.random() - 0.5) * 0.02)) * 100) / 100);
    }
    const price = history[29]!;
    return {
      id: 'T' + i,
      symbol: 'ABC' + i,
      price,
      history,
      change: (price - history[28]!) / history[28]!,
      volume: Math.floor(Math.random() * 1_000_000),
      load: Math.round(Math.random() * 100),
    };
  });
};

ui.page('/examples/live-table-components', () => {
  // State
  const controls = ui.state({ rowCount: 200, tickMs: 250, churnPct: 5, highlight: true, running: true });

  let rows = makeRows(controls.rowCount);
  let table!: DataTableElement;
  let timer!: ReturnType<typeof ui.timer>;

  // Metrics bookkeeping
  let ticks = 0;
  const timings: number[] = [];
  const changeLog: Array<{ t: number; n: number }> = [];
  let lastPaint = -Infinity;

  let kpis: ReturnType<typeof ui.stat>;


  // Numbers (not strings) so the stat cards animate between values.
  const kpiItems = (rate: number, avgMs: number) => [
    { title: 'Ticks', value: ticks, description: `Target ${Math.round(1000 / controls.tickMs)} updates/s` },
    { title: 'Rows changed / s', value: rate },
    { title: 'Server tick time', value: Number(avgMs.toFixed(2)), description: 'avg ms, last 20 ticks' },
    { title: 'Rows', value: controls.rowCount },
  ];

  // Throttled to at most one paint every 500ms (forced on control changes).
  const paintMetrics = (force = false) => {
    const now = performance.now();
    if (!force && now - lastPaint < 500) return;
    lastPaint = now;
    const windowStart = now - 2000;
    while (changeLog.length && changeLog[0]!.t < windowStart) changeLog.shift();
    const changed = changeLog.reduce((sum, e) => sum + e.n, 0);
    const span = changeLog.length ? Math.max(1, (now - changeLog[0]!.t) / 1000) : 1;
    const avg = timings.length ? timings.reduce((a, b) => a + b, 0) / timings.length : 0;
    kpis.setItems(kpiItems(Math.round(changed / span), avg));
  };

  const tick = () => {
    const t0 = performance.now();
    const k = Math.ceil((controls.rowCount * controls.churnPct) / 100);
    for (let n = 0; n < k; n++) {
      const i = Math.floor(Math.random() * rows.length);
      const r = rows[i]!;
      const price = Math.round(Math.max(0.01, r.price * (1 + (Math.random() - 0.5) * 0.02)) * 100) / 100;
      rows[i] = {
        ...r,
        price,
        change: r.price ? (price - r.price) / r.price : 0,
        volume: r.volume + Math.floor(Math.random() * 5000),
        history: [...r.history.slice(-29), price],
        load: Math.min(100, Math.max(0, r.load + Math.round((Math.random() - 0.5) * 20))),
      };
    }
    table.setRows([...rows]);

    timings.push(performance.now() - t0);
    if (timings.length > 20) timings.shift();
    changeLog.push({ t: t0, n: k });
    ticks++;
    paintMetrics();
  };

  // Timers are session-scoped and cancelled on navigation (see core/timer.ts),
  // so no explicit unmount is needed. Changing the interval cancels the old handle.
  const startTimer = () => {
    timer?.cancel();
    timer = ui.timer(controls.tickMs / 1000, tick);
    if (!controls.running) timer.deactivate();
  };

  const setRowCount = (n: number) => {
    controls.rowCount = n;
    rows = makeRows(n);
    table.setRows([...rows]);
    paintMetrics(true);
  };

  const setTickMs = (ms: number) => {
    controls.tickMs = ms;
    startTimer();
    paintMetrics(true);
  };

  const setChurn = (pct: number) => {
    controls.churnPct = pct;
  };

  const setHighlight = (on: boolean) => {
    if (controls.highlight === on) return;
    controls.highlight = on;
    table.setHighlightChanges(controls.highlight);
  };

  const togglePause = () => {
    controls.running = !controls.running;
    if (controls.running) timer.activate();
    else timer.deactivate();
  };

  const choiceRow = (
    label: string,
    options: Array<{ text: string; active: boolean; onClick: () => void }>,
  ) => {
    ui.row(() => {
      ui.label(label).classes('text-sm text-muted-foreground self-center');
      for (const o of options) {
        ui.button(o.text, {
          size: 'sm',
          variant: o.active ? 'default' : 'outline',
          onClick: o.onClick,
        });
      }
    }, { gap: 2 }).classes('flex-wrap items-center');
  };

  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(
        undefined,
        'Live component cells under load: sparklines, badges and progress bars update with a price feed.',
      );

      ui.card({ title: 'Controls', description: 'Pick the data size, update rate, churn and highlight mode.', gap: 3 }, () => {
        ui.auto(() => {
          ui.column(() => {
            choiceRow(
              'Rows',
              [50, 200, 500].map((n) => ({
                text: n.toLocaleString(),
                active: controls.rowCount === n,
                onClick: () => setRowCount(n),
              })),
            );
            choiceRow(
              'Update every',
              [1000, 500, 250].map((ms) => ({
                text: `${ms}ms`,
                active: controls.tickMs === ms,
                onClick: () => setTickMs(ms),
              })),
            );
            choiceRow(
              'Churn',
              [5, 20, 50].map((pct) => ({
                text: `${pct}%`,
                active: controls.churnPct === pct,
                onClick: () => setChurn(pct),
              })),
            );
            choiceRow('Highlight', [
              { text: 'On', active: controls.highlight, onClick: () => setHighlight(true) },
              { text: 'Off', active: !controls.highlight, onClick: () => setHighlight(false) },
            ]);
            choiceRow('Feed', [
              { text: controls.running ? 'Pause' : 'Resume', active: false, onClick: togglePause },
            ]);
          }, { gap: 2 });
        });
      });

      kpis = ui.stat(kpiItems(0, 0));

      ui.card({ title: 'Live table', description: 'Virtualized: only visible rows are in the DOM. Changed rows flash for 1.6s.', gap: 3 }, () => {
        table = ui.dataTable(rows, {
          keyField: 'id',
          highlightChanges: controls.highlight,
          pageSize: 0,
          fill: false,
          maxHeight: '28rem',
          stackOnMobile: true,
          columnToggle: false,
          exportable: false,
          columns: [
            { key: 'symbol', header: 'Symbol' },
            { key: 'price', header: 'Price', format: 'currency' },
            {
              key: 'history',
              header: 'Trend',
              value: (row) => row.change,
              render: (row) => ui.sparkline({
                data: (row.history as number[]).map((v, i) => ({ i, v })),
                xKey: 'i',
                yKey: 'v',
                type: 'line',
                height: 32,
                color: Number(row.change) >= 0 ? 'var(--chart-2)' : 'var(--chart-5)',
              }).classes('w-40'),
            },
            {
              key: 'change',
              header: 'Change',
              value: (row) => row.change,
              render: (row) => {
                const change = Number(row.change);
                return ui.badge(`${change >= 0 ? '+' : ''}${(change * 100).toFixed(2)}%`, {
                  color: change >= 0 ? 'green' : 'red',
                });
              },
            },
            {
              key: 'load',
              header: 'Load',
              value: (row) => row.load,
              render: (row) => ui.progress({ value: Number(row.load), className: 'w-24' }),
            },
            { key: 'volume', header: 'Volume', format: 'number' },
          ],
        });
      });

      ui.markdown(
        [
          '**What is happening.** Each tick the server mutates a random slice of rows and calls `setRows` with a new array. Only the changed row objects are new, so only those rows are sent as patches. Unchanged rows keep their DOM.',
          '',
          'The flash is pure CSS on the rows that changed. It respects `prefers-reduced-motion`. Virtualization keeps the DOM small while each trend retains the last 30 prices.',
          '',
          '**Try it.** Crank Rows to 500 and Churn to 50%, then toggle Highlight off and on to compare the cost. Highlight toggles live via `table.setHighlightChanges()`.',
        ].join('\n'),
      ).classes('text-sm text-muted-foreground');

      startTimer();
      paintMetrics(true);
    }, { gap: 6 });
  });
});
