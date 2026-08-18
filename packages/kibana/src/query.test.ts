import { describe, expect, test } from 'bun:test';
import { Kibana } from './kibana';

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return handler(url, init);
  }) as typeof fetch;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('QueryBuilder', () => {
  test('builds guided bool query with range, match, exclude, select', () => {
    const kbn = new Kibana({
      baseUrl: 'https://kibana.example.com',
      esTransport: 'path',
      fetch: mockFetch(() => jsonResponse({ hits: { hits: [] } })),
    });

    const body = kbn
      .query('logstash-*')
      .between('2026-07-01T00:00:00.000Z', '2026-07-01T23:59:59.999Z')
      .match('*receivePartnerEvent*')
      .exclude('*ag_ibersol_webhook_notify_queue*')
      .select('@timestamp', 'message')
      .body();

    expect(body._source).toEqual(['@timestamp', 'message']);
    expect(body.query).toEqual({
      bool: {
        must: [
          { query_string: { query: '*receivePartnerEvent*', default_field: 'message' } },
          {
            range: {
              '@timestamp': {
                gte: '2026-07-01T00:00:00.000Z',
                lte: '2026-07-01T23:59:59.999Z',
              },
            },
          },
        ],
        must_not: [
          {
            query_string: {
              query: '*ag_ibersol_webhook_notify_queue*',
              default_field: 'message',
            },
          },
        ],
      },
    });
  });

  test('stream uses search_after pagination', async () => {
    const bodies: unknown[] = [];
    let page = 0;

    const kbn = new Kibana({
      baseUrl: 'https://kibana.example.com',
      esTransport: 'path',
      fetch: mockFetch((_url, init) => {
        bodies.push(JSON.parse(String(init?.body)));
        page += 1;
        if (page === 1) {
          return jsonResponse({
            hits: {
              hits: [
                { _id: '1', _index: 'logs', _source: { message: 'a' }, sort: [1, 0] },
                { _id: '2', _index: 'logs', _source: { message: 'b' }, sort: [2, 0] },
              ],
            },
          });
        }
        return jsonResponse({
          hits: {
            hits: [{ _id: '3', _index: 'logs', _source: { message: 'c' }, sort: [3, 0] }],
          },
        });
      }),
    });

    const sources = await kbn
      .query<{ message: string }>('logs-*')
      .match('*foo*')
      .pageSize(2)
      .sources();

    expect(sources).toEqual([{ message: 'a' }, { message: 'b' }, { message: 'c' }]);
    expect((bodies[1] as any).search_after).toEqual([2, 0]);
  });

  test('lastDays snaps to utc day bounds', () => {
    const kbn = new Kibana({
      baseUrl: 'https://kibana.example.com',
      fetch: mockFetch(() => jsonResponse({})),
    });

    const body = kbn.query('logs-*').lastDays(1, '2026-07-22T15:00:00.000Z').body();
    const range = (body.query as any).bool.must[0].range['@timestamp'];
    expect(range.gte).toBe('2026-07-21T00:00:00.000Z');
    expect(range.lte).toBe('2026-07-22T23:59:59.999Z');
  });

  test('toParquet writes searchable parquet via duckdb', async () => {
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { DuckDB } = await import('@close-by/clay-duckdb');

    let page = 0;
    const kbn = new Kibana({
      baseUrl: 'https://kibana.example.com',
      esTransport: 'path',
      fetch: mockFetch(() => {
        page += 1;
        if (page === 1) {
          return jsonResponse({
            hits: {
              hits: [
                {
                  _id: 'a',
                  _index: 'logs',
                  _source: { '@timestamp': '2026-07-01T00:00:00.000Z', message: 'one' },
                  sort: [1, 0],
                },
                {
                  _id: 'b',
                  _index: 'logs',
                  _source: { '@timestamp': '2026-07-01T00:01:00.000Z', message: 'two' },
                  sort: [2, 0],
                },
              ],
            },
          });
        }
        return jsonResponse({ hits: { hits: [] } });
      }),
    });

    const dir = await mkdtemp(join(tmpdir(), 'clay-parquet-'));
    const out = join(dir, 'logs.parquet');
    try {
      const result = await kbn
        .query('logs-*')
        .match('*')
        .select('@timestamp', 'message')
        .pageSize(10)
        .toParquet(out);

      expect(result.rows).toBe(2);
      expect(result.path).toBe(out);

      const duck = new DuckDB();
      const db = await duck.connect('check');
      const rows = await db.query(
        `SELECT message FROM '${out.replace(/'/g, "''")}' ORDER BY message`,
      );
      await duck.closeAll();
      expect(rows).toEqual([{ message: 'one' }, { message: 'two' }]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
