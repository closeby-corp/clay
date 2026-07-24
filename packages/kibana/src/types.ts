export type KibanaConfig = {
  /** Kibana base URL, e.g. `https://kibana.example.com` (no trailing slash required). */
  baseUrl: string;
  /** API key auth (`Authorization: ApiKey …`). */
  apiKey?: string;
  /** Basic auth username (use with `password`). */
  username?: string;
  /** Basic auth password. */
  password?: string;
  /**
   * Older Kibana (e.g. 6.x) expects `kbn-version` on ES proxy requests.
   * Example: `'6.8.0'`.
   */
  kbnVersion?: string;
  /**
   * How Elasticsearch is reached through Kibana:
   * - `console` — `POST /api/console/proxy?path=…&method=…` (Kibana 7+/8+)
   * - `path` — `{esPathPrefix}/{index}/_search` (Kibana 6.x style `/elasticsearch/…`)
   */
  esTransport?: 'console' | 'path';
  /** Path prefix when `esTransport` is `'path'`. Default: `/elasticsearch`. */
  esPathPrefix?: string;
  /** Kibana space id; prefixes Kibana API paths with `/s/{space}`. */
  space?: string;
  /** Extra headers merged into every request. */
  headers?: Record<string, string>;
  /** Override `fetch` (useful in tests). Defaults to global `fetch`. */
  fetch?: typeof fetch;
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export type KibanaRequestOptions = {
  /** Query string params (encoded automatically). */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** JSON body (objects are stringified). */
  body?: unknown;
  /** Extra headers for this call. */
  headers?: Record<string, string>;
};

export type EsSearchBody = {
  query?: unknown;
  size?: number;
  from?: number;
  sort?: unknown;
  search_after?: unknown;
  _source?: unknown;
  aggs?: unknown;
  aggregations?: unknown;
  [key: string]: unknown;
};

export type EsHit<T = Record<string, unknown>> = {
  _index: string;
  _id: string;
  _score?: number | null;
  _source?: T;
  sort?: unknown[];
  [key: string]: unknown;
};

export type EsSearchResponse<T = Record<string, unknown>> = {
  took?: number;
  timed_out?: boolean;
  hits?: {
    total?: number | { value: number; relation: string };
    max_score?: number | null;
    hits?: EsHit<T>[];
  };
  aggregations?: Record<string, unknown>;
  [key: string]: unknown;
};

export type PaginateSearchOptions = {
  /** Hits per page. Default: `1000`. */
  pageSize?: number;
  /**
   * Sort used for `search_after` pagination.
   * Default: `[{ '@timestamp': { order: 'asc' } }, { _doc: { order: 'asc' } }]`.
   */
  sort?: unknown;
};

export type SavedObjectFindParams = {
  type: string | string[];
  search?: string;
  fields?: string[];
  perPage?: number;
  page?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
};

export type SavedObject<T = Record<string, unknown>> = {
  type: string;
  id: string;
  attributes: T;
  references?: Array<{ name: string; type: string; id: string }>;
  updated_at?: string;
  version?: string;
  [key: string]: unknown;
};

export type SavedObjectFindResponse<T = Record<string, unknown>> = {
  page: number;
  per_page: number;
  total: number;
  saved_objects: SavedObject<T>[];
};
