import { KibanaError } from './error';
import { QueryBuilder } from './query';
import type {
  EsHit,
  EsSearchBody,
  EsSearchResponse,
  HttpMethod,
  KibanaConfig,
  KibanaRequestOptions,
  PaginateSearchOptions,
  SavedObject,
  SavedObjectFindParams,
  SavedObjectFindResponse,
} from './types';

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function ensureLeadingSlash(path: string): string {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

function buildAuthHeader(config: KibanaConfig): string | undefined {
  if (config.apiKey) return `ApiKey ${config.apiKey}`;
  if (config.username != null) {
    const token = Buffer.from(`${config.username}:${config.password ?? ''}`, 'utf8').toString(
      'base64',
    );
    return `Basic ${token}`;
  }
  return undefined;
}

function buildQuery(query?: KibanaRequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function buildEncodedQuery(query: Record<string, string | number | boolean>): string {
  const parts = Object.entries(query).map(
    ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
  );
  return parts.length ? `?${parts.join('&')}` : '';
}

async function parseResponse(res: Response, label: string): Promise<unknown> {
  const text = await res.text();
  let parsed: unknown = text;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  } else {
    parsed = null;
  }

  if (!res.ok) {
    const msg =
      typeof parsed === 'object' &&
      parsed &&
      'message' in parsed &&
      typeof (parsed as { message: unknown }).message === 'string'
        ? (parsed as { message: string }).message
        : `${label} (${res.status})`;
    throw new KibanaError(msg, res.status, parsed);
  }

  return parsed;
}

const DEFAULT_SEARCH_AFTER_SORT = [
  { '@timestamp': { order: 'asc' as const } },
  { _doc: { order: 'asc' as const } },
];

/**
 * Kibana REST client with Elasticsearch access (console proxy or `/elasticsearch` path)
 * and `search_after` pagination for walking every matching hit.
 */
export class Kibana {
  private readonly baseUrl: string;
  private readonly space?: string;
  private readonly esTransport: 'console' | 'path';
  private readonly esPathPrefix: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly config: KibanaConfig) {
    if (!config.baseUrl?.trim()) throw new Error('Kibana config requires baseUrl');
    this.baseUrl = trimSlash(config.baseUrl);
    this.space = config.space?.trim() || undefined;
    this.esTransport = config.esTransport ?? 'console';
    this.esPathPrefix = trimSlash(ensureLeadingSlash(config.esPathPrefix ?? '/elasticsearch'));
    this.fetchImpl = config.fetch ?? globalThis.fetch.bind(globalThis);

    const headers: Record<string, string> = {
      'kbn-xsrf': 'true',
      Accept: 'application/json',
      ...config.headers,
    };
    const auth = buildAuthHeader(config);
    if (auth) headers.Authorization = auth;
    if (config.kbnVersion) headers['kbn-version'] = config.kbnVersion;
    this.defaultHeaders = headers;
  }

  /** Resolve a Kibana API path, including optional space prefix. */
  path(apiPath: string): string {
    const normalized = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
    if (!this.space || this.space === 'default') return normalized;
    if (normalized.startsWith('/s/')) return normalized;
    return `/s/${this.space}${normalized}`;
  }

  /**
   * Call any Kibana REST endpoint.
   * `path` is a Kibana path such as `/api/spaces/space` (space prefix applied automatically).
   */
  async request<T = unknown>(
    method: HttpMethod,
    apiPath: string,
    options: KibanaRequestOptions = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${this.path(apiPath)}${buildQuery(options.query)}`;
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    let body: string | undefined;
    if (options.body !== undefined && options.body !== null) {
      if (typeof options.body === 'string') {
        body = options.body;
        headers['Content-Type'] ??= 'application/json';
      } else {
        body = JSON.stringify(options.body);
        headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
      }
    }

    const res = await this.fetchImpl(url, { method, headers, body });
    return (await parseResponse(res, `Kibana request failed: ${method} ${apiPath}`)) as T;
  }

  /**
   * Proxy an Elasticsearch request through Kibana.
   * Example: `es('POST', 'my-index/_search', { query: { match_all: {} } })`
   */
  async es<T = unknown>(method: HttpMethod, esPath: string, body?: unknown): Promise<T> {
    const cleaned = esPath.replace(/^\/+/, '');
    const headers: Record<string, string> = { ...this.defaultHeaders };
    let payload: string | undefined;
    if (body !== undefined && body !== null) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    }

    let url: string;
    let httpMethod: HttpMethod;

    if (this.esTransport === 'path') {
      url = `${this.baseUrl}${this.esPathPrefix}/${cleaned}`;
      httpMethod = method;
    } else {
      url = `${this.baseUrl}${this.path('/api/console/proxy')}${buildEncodedQuery({
        path: cleaned,
        method,
      })}`;
      httpMethod = 'POST';
    }

    const res = await this.fetchImpl(url, { method: httpMethod, headers, body: payload });
    return (await parseResponse(res, `Kibana ES proxy failed: ${method} ${cleaned}`)) as T;
  }

  /** Convenience wrapper for `{index}/_search` (single page). */
  async search<T = Record<string, unknown>>(
    index: string,
    body: EsSearchBody = {},
  ): Promise<EsSearchResponse<T>> {
    const target = `${index.replace(/^\/+|\/+$/g, '')}/_search`;
    return this.es<EsSearchResponse<T>>('POST', target, body);
  }

  /**
   * Yield every matching hit using `search_after` pagination (same pattern as deep log exports).
   * Do not pass `size`, `sort`, or `search_after` in `queryBody` — they are managed here.
   */
  async *paginateSearch<T = Record<string, unknown>>(
    index: string,
    queryBody: EsSearchBody = {},
    options: PaginateSearchOptions = {},
  ): AsyncGenerator<EsHit<T>> {
    const pageSize = options.pageSize ?? 1000;
    const sort = options.sort ?? DEFAULT_SEARCH_AFTER_SORT;
    let searchAfter: unknown[] | undefined;

    for (;;) {
      const body: EsSearchBody = {
        ...queryBody,
        size: pageSize,
        sort,
      };
      if (searchAfter) body.search_after = searchAfter;

      const res = await this.search<T>(index, body);
      const hits = res.hits?.hits ?? [];
      if (hits.length === 0) break;

      for (const hit of hits) {
        yield hit;
      }

      const last = hits[hits.length - 1];
      if (!last?.sort) {
        throw new Error(
          'paginateSearch requires sort values on hits; ensure the index supports the configured sort',
        );
      }
      searchAfter = last.sort;
      if (hits.length < pageSize) break;
    }
  }

  /** Collect every matching hit into an array (uses `paginateSearch`). */
  async searchAll<T = Record<string, unknown>>(
    index: string,
    queryBody: EsSearchBody = {},
    options: PaginateSearchOptions = {},
  ): Promise<EsHit<T>[]> {
    const out: EsHit<T>[] = [];
    for await (const hit of this.paginateSearch<T>(index, queryBody, options)) {
      out.push(hit);
    }
    return out;
  }

  /** Start a guided query for an index pattern. */
  query<T = Record<string, unknown>>(index: string): QueryBuilder<T> {
    return new QueryBuilder<T>(this, index);
  }

  /** Saved Objects find. */
  async findSavedObjects<T = Record<string, unknown>>(
    params: SavedObjectFindParams,
  ): Promise<SavedObjectFindResponse<T>> {
    const types = Array.isArray(params.type) ? params.type : [params.type];
    const query: Record<string, string | number | boolean> = {
      per_page: params.perPage ?? 20,
      page: params.page ?? 1,
    };
    if (params.search) query.search = params.search;
    if (params.sortField) query.sort_field = params.sortField;
    if (params.sortOrder) query.sort_order = params.sortOrder;
    if (params.fields?.length) query.fields = params.fields.join(',');

    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) searchParams.append(k, String(v));
    for (const t of types) searchParams.append('type', t);

    return this.request<SavedObjectFindResponse<T>>(
      'GET',
      `/api/saved_objects/_find?${searchParams.toString()}`,
    );
  }

  async getSavedObject<T = Record<string, unknown>>(
    type: string,
    id: string,
  ): Promise<SavedObject<T>> {
    return this.request<SavedObject<T>>(
      'GET',
      `/api/saved_objects/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
    );
  }
}
