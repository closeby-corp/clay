import { describe, expect, test } from 'bun:test';
import { KibanaError } from './error';
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

describe('Kibana client', () => {
  test('sends ApiKey auth and kbn-xsrf on request', async () => {
    let seenUrl = '';
    let seenHeaders: Headers | undefined;

    const kbn = new Kibana({
      baseUrl: 'https://kibana.example.com/',
      apiKey: 'secret-key',
      fetch: mockFetch((url, init) => {
        seenUrl = url;
        seenHeaders = new Headers(init?.headers);
        return jsonResponse({ ok: true });
      }),
    });

    await kbn.request('GET', '/api/spaces/space');
    expect(seenUrl).toBe('https://kibana.example.com/api/spaces/space');
    expect(seenHeaders?.get('Authorization')).toBe('ApiKey secret-key');
    expect(seenHeaders?.get('kbn-xsrf')).toBe('true');
  });

  test('allows unauthenticated internal access with kbn-version', async () => {
    let seenHeaders: Headers | undefined;

    const kbn = new Kibana({
      baseUrl: 'https://kibana.internal.example.com',
      kbnVersion: '6.8.0',
      esTransport: 'path',
      fetch: mockFetch((_url, init) => {
        seenHeaders = new Headers(init?.headers);
        return jsonResponse({ hits: { hits: [] } });
      }),
    });

    await kbn.search('logs-*', { query: { match_all: {} } });
    expect(seenHeaders?.get('Authorization')).toBeNull();
    expect(seenHeaders?.get('kbn-version')).toBe('6.8.0');
  });

  test('basic auth and space prefix', async () => {
    let seenUrl = '';
    let seenAuth = '';

    const kbn = new Kibana({
      baseUrl: 'https://kibana.example.com',
      username: 'elastic',
      password: 'changeme',
      space: 'sales',
      fetch: mockFetch((url, init) => {
        seenUrl = url;
        seenAuth = new Headers(init?.headers).get('Authorization') ?? '';
        return jsonResponse({});
      }),
    });

    await kbn.request('GET', '/api/data_views');
    expect(seenUrl).toBe('https://kibana.example.com/s/sales/api/data_views');
    expect(seenAuth).toBe(`Basic ${Buffer.from('elastic:changeme').toString('base64')}`);
  });

  test('search proxies through console proxy', async () => {
    let seenUrl = '';
    let seenMethod = '';
    let seenBody = '';

    const kbn = new Kibana({
      baseUrl: 'https://kibana.example.com',
      apiKey: 'k',
      fetch: mockFetch((url, init) => {
        seenUrl = url;
        seenMethod = init?.method ?? '';
        seenBody = String(init?.body ?? '');
        return jsonResponse({
          hits: {
            total: { value: 1, relation: 'eq' },
            hits: [{ _id: '1', _index: 'logs', _source: { msg: 'hi' } }],
          },
        });
      }),
    });

    const res = await kbn.search('logs-*', { query: { match_all: {} }, size: 5 });
    expect(seenMethod).toBe('POST');
    expect(seenUrl).toContain('/api/console/proxy?');
    expect(seenUrl).toContain('path=logs-*%2F_search');
    expect(seenUrl).toContain('method=POST');
    expect(JSON.parse(seenBody)).toEqual({ query: { match_all: {} }, size: 5 });
    expect(res.hits?.hits?.[0]?._source).toEqual({ msg: 'hi' });
  });

  test('path transport uses /elasticsearch/{index}/_search', async () => {
    let seenUrl = '';
    let seenMethod = '';

    const kbn = new Kibana({
      baseUrl: 'https://kibana.internal.factsandit.pt',
      kbnVersion: '6.8.0',
      esTransport: 'path',
      fetch: mockFetch((url, init) => {
        seenUrl = url;
        seenMethod = init?.method ?? '';
        return jsonResponse({ hits: { hits: [] } });
      }),
    });

    await kbn.search('logstash-production-logback-*', { query: { match_all: {} } });
    expect(seenMethod).toBe('POST');
    expect(seenUrl).toBe(
      'https://kibana.internal.factsandit.pt/elasticsearch/logstash-production-logback-*/_search',
    );
  });

  test('es GET without body', async () => {
    let seenUrl = '';
    let seenBody: string | undefined;

    const kbn = new Kibana({
      baseUrl: 'https://kibana.example.com',
      apiKey: 'k',
      fetch: mockFetch((url, init) => {
        seenUrl = url;
        seenBody = init?.body as string | undefined;
        return jsonResponse({ acknowledged: true });
      }),
    });

    await kbn.es('GET', '_cluster/health');
    expect(seenUrl).toContain('path=_cluster%2Fhealth');
    expect(seenUrl).toContain('method=GET');
    expect(seenBody).toBeUndefined();
  });

  test('paginateSearch walks every hit with search_after', async () => {
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
                { _id: 'a', _index: 'logs', _source: { message: '1' }, sort: [1, 0] },
                { _id: 'b', _index: 'logs', _source: { message: '2' }, sort: [2, 0] },
              ],
            },
          });
        }
        if (page === 2) {
          return jsonResponse({
            hits: {
              hits: [{ _id: 'c', _index: 'logs', _source: { message: '3' }, sort: [3, 0] }],
            },
          });
        }
        return jsonResponse({ hits: { hits: [] } });
      }),
    });

    const hits = [];
    for await (const hit of kbn.paginateSearch(
      'logs-*',
      { query: { match_all: {} }, _source: ['message'] },
      { pageSize: 2 },
    )) {
      hits.push(hit);
    }

    expect(hits.map((h) => h._id)).toEqual(['a', 'b', 'c']);
    expect(bodies[0]).toMatchObject({
      size: 2,
      query: { match_all: {} },
      _source: ['message'],
    });
    expect((bodies[0] as any).search_after).toBeUndefined();
    expect((bodies[0] as any).sort).toBeDefined();
    expect(bodies[1]).toMatchObject({ size: 2, search_after: [2, 0] });
  });

  test('findSavedObjects builds type query params', async () => {
    let seenUrl = '';

    const kbn = new Kibana({
      baseUrl: 'https://kibana.example.com',
      apiKey: 'k',
      fetch: mockFetch((url) => {
        seenUrl = url;
        return jsonResponse({ page: 1, per_page: 20, total: 0, saved_objects: [] });
      }),
    });

    await kbn.findSavedObjects({
      type: ['dashboard', 'visualization'],
      search: 'Sales',
      perPage: 10,
    });
    expect(seenUrl).toContain('/api/saved_objects/_find?');
    expect(seenUrl).toContain('type=dashboard');
    expect(seenUrl).toContain('type=visualization');
    expect(seenUrl).toContain('search=Sales');
    expect(seenUrl).toContain('per_page=10');
  });

  test('throws KibanaError on non-OK response', async () => {
    const kbn = new Kibana({
      baseUrl: 'https://kibana.example.com',
      apiKey: 'k',
      fetch: mockFetch(() => jsonResponse({ message: 'nope' }, 403)),
    });

    try {
      await kbn.request('GET', '/api/spaces/space');
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(KibanaError);
      expect((err as KibanaError).status).toBe(403);
      expect((err as KibanaError).message).toBe('nope');
    }
  });
});
