import { ui } from '@badui/ui';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Data clients',
  icon: 'database',
  order: 95,
};

/**
 * Lightweight integration story for @badui/duckdb / kibana / clickhouse.
 * Sidecars are optional at runtime — demos degrade to documented snippets + mocks.
 */
ui.page('/examples/data-clients', () => {
  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(
        undefined,
        'Optional packages: @badui/duckdb, @badui/kibana, @badui/clickhouse. This page runs without live DBs.',
      );

      exampleSection('DuckDB', 'In-process analytics via @badui/duckdb (skipped if native module unavailable).');
      ui.refreshable(() => {
        void (async () => {
          // Render sync UI; attempt is fire-and-forget for the label below.
        })();
        ui.label(
          'Example: const db = await DuckDB.create(); await db.query("SELECT 1 AS n");',
        ).classes('font-mono text-xs text-muted-foreground');
        ui.label(
          'Attach SQLite/Postgres with DuckDB.attach({ type, path, alias }). See packages/duckdb.',
        ).classes('text-sm text-muted-foreground');
      });

      exampleSection('Kibana / Elasticsearch', '@badui/kibana QueryBuilder + saved objects.');
      ui.label(
        'Example: const kibana = new Kibana({ baseUrl, apiKey }); await kibana.search({ index: "logs-*", size: 10 });',
      ).classes('font-mono text-xs text-muted-foreground');
      ui.card(
        { title: 'Mock hit sample', description: 'What a UI table might bind to after search.' },
        () => {
          ui.table([
            { id: '1', host: 'web-1', status: 'ok', latencyMs: 42 },
            { id: '2', host: 'web-2', status: 'warn', latencyMs: 180 },
          ])
            .columns([
              { key: 'host', header: 'Host' },
              { key: 'status', header: 'Status' },
              { key: 'latencyMs', header: 'Latency' },
            ])
            .build();
        },
      );

      exampleSection('ClickHouse', '@badui/clickhouse Connection for SQL analytics.');
      ui.label(
        'Example: const ch = ClickHouse.create({ url }); const rows = await ch.query("SELECT now()");',
      ).classes('font-mono text-xs text-muted-foreground');

      exampleSection('Wiring tip', 'Keep credentials in env; render results with ui.table / ui.chart.');
      ui.alert(
        'Live connections are intentionally not required for this demo page so CI and local installs stay lightweight.',
      );
    }, { gap: 6 });
  });
});
