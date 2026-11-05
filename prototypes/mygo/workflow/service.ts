import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, unlink } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { createLoginLimiter, hashPassword, verifyPassword } from '../../../packages/auth/src';
import { createFilePersistence } from '../../../packages/persistence-file/src';
import {
  AUTH_COOKIE_NAME,
  authSessionClearCookieHeader,
  authSessionSetCookieHeader,
  readAuthCookie,
  signAuthToken,
  verifyAuthToken,
} from '../../../packages/server/src/auth-cookie';
import { handleMultipartUpload, UploadError } from '../../../packages/server/src/upload';

const COOKIE_NAME = 'clay-mygo-uploads';
const SESSION_AGE_MS = 12 * 60 * 60 * 1000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_COUNT = 10;
const MAX_REQUEST_BYTES = 52 * 1024 * 1024;
const ACCEPT = 'image/*,.txt,.md,.pdf,.csv';

export type User = { id: string; name: string; role: string };
export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
};
export type UploadList = { files: UploadedFile[]; lifetimeUploads: number };

type StoredFile = UploadedFile & { windowId: string };
type UserState = { files: StoredFile[]; lifetimeUploads: number };
type Account = { user: User; passwordHash: string };
type Session = { userId: string; expiresAt: number };

export type UploadsAppOptions = {
  dataDir: string;
  assetsDir: string;
  secret?: string;
};

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

const accounts = new Map<string, Account>([
  ['alice', { user: { id: 'alice', name: 'Alice', role: 'user' }, passwordHash: hashPassword('demo-alice') }],
  ['bob', { user: { id: 'bob', name: 'Bob', role: 'user' }, passwordHash: hashPassword('demo-bob') }],
]);

function emptyState(): UserState {
  return { files: [], lifetimeUploads: 0 };
}

function validState(value: unknown): UserState {
  if (
    !value || typeof value !== 'object' ||
    !Array.isArray((value as UserState).files) ||
    !Number.isSafeInteger((value as UserState).lifetimeUploads) ||
    (value as UserState).lifetimeUploads < 0
  ) {
    throw new Error('Stored upload metadata is invalid');
  }
  return value as UserState;
}

function jsonError(status: number, error: string, code?: string, headers?: HeadersInit): Response {
  return Response.json(code ? { error, code } : { error }, { status, headers });
}

function cookieHeader(header: string, name: string): string {
  return header.replace(`${AUTH_COOKIE_NAME}=`, `${name}=`);
}

function jsonCookie(token: string, secret: string): string {
  return cookieHeader(authSessionSetCookieHeader(token, { secret }), COOKIE_NAME);
}

function clearCookie(): string {
  return cookieHeader(authSessionClearCookieHeader(), COOKIE_NAME);
}

function userForId(userId: string): User | null {
  for (const account of accounts.values()) {
    if (account.user.id === userId) return account.user;
  }
  return null;
}

function safeContentType(type: string): string {
  return /^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/.test(type)
    ? type
    : 'application/octet-stream';
}

function attachmentName(name: string): string {
  return encodeURIComponent(name).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function isInside(root: string, path: string): boolean {
  return path === root || path.startsWith(`${root}${sep}`);
}

function mimeType(path: string): string {
  switch (extname(path).toLowerCase()) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': case '.mjs': return 'text/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.wasm': return 'application/wasm';
    default: return 'application/octet-stream';
  }
}

async function boundedBody(request: Request, limit: number): Promise<Buffer> {
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) throw new HttpError(400, 'Invalid Content-Length');
    if (Number(contentLength) > limit) throw new HttpError(413, 'Request body is too large', 'too_large');
  }
  if (!request.body) return Buffer.alloc(0);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, 'Request body is too large', 'too_large');
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Could not read request body');
  }
  return Buffer.concat(chunks, size);
}

function parseJson(bytes: Buffer): unknown {
  try {
    return JSON.parse(bytes.toString('utf8')) as unknown;
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}

export function createUploadsApp(options: UploadsAppOptions) {
  const dataDir = resolve(options.dataDir);
  const assetsDir = resolve(options.assetsDir);
  const uploadDir = join(dataDir, 'uploads');
  const persistence = createFilePersistence({ dir: join(dataDir, 'manifest') });
  const secret = options.secret ?? randomBytes(32).toString('hex');
  const sessions = new Map<string, Session>();
  const loginLimiter = createLoginLimiter();
  const userLocks = new Map<string, Promise<void>>();

  async function withUserLock<T>(userId: string, action: () => Promise<T>): Promise<T> {
    const previous = userLocks.get(userId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolveLock) => { release = resolveLock; });
    userLocks.set(userId, current);
    await previous;
    try {
      return await action();
    } finally {
      release();
      if (userLocks.get(userId) === current) userLocks.delete(userId);
    }
  }

  async function loadState(userId: string): Promise<UserState> {
    const raw = await persistence.load(`uploads:${userId}`);
    return raw === null ? emptyState() : validState(JSON.parse(raw) as unknown);
  }

  async function saveState(userId: string, state: UserState): Promise<void> {
    await persistence.save(`uploads:${userId}`, JSON.stringify(state));
  }

  function resolveSession(headers: Headers): { sessionId: string; session: Session; user: User } | null {
    const token = readAuthCookie(headers, COOKIE_NAME);
    const sessionId = token ? verifyAuthToken(token, secret, { maxAgeMs: SESSION_AGE_MS }) : null;
    if (!sessionId) return null;
    const session = sessions.get(sessionId);
    if (!session || session.expiresAt <= Date.now()) {
      sessions.delete(sessionId);
      return null;
    }
    const user = userForId(session.userId);
    return user ? { sessionId, session, user } : null;
  }

  function guardedUser(request: Request): { sessionId: string; session: Session; user: User } | Response {
    const resolved = resolveSession(request.headers);
    if (!resolved) return jsonError(401, 'Sign in required');
    if (request.headers.get('x-prototype-user') !== resolved.user.id) {
      return jsonError(401, 'Prototype user does not match the authenticated session');
    }
    return resolved;
  }

  function windowId(request: Request): string | Response {
    const id = request.headers.get('x-prototype-window');
    if (!id || id.length > 80 || /[\u0000-\u001f\u007f]/.test(id)) {
      return jsonError(400, 'A valid X-Prototype-Window header is required');
    }
    return id;
  }

  function sameOrigin(request: Request): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return true;
    try {
      return new URL(origin).origin === new URL(request.url).origin;
    } catch {
      return false;
    }
  }

  async function login(request: Request, clientAddress?: string): Promise<Response> {
    if (request.method !== 'POST') return jsonError(405, 'Method not allowed', undefined, { Allow: 'POST' });
    const body = parseJson(await boundedBody(request, 64 * 1024));
    const input = body as { username?: unknown; password?: unknown } | null;
    const username = typeof input?.username === 'string' ? input.username : '';
    const password = typeof input?.password === 'string' ? input.password : '';
    const account = accounts.get(username);
    const limiterKey = `${clientAddress || 'local'}:${username}`;
    const check = loginLimiter.check(limiterKey);
    if ('retryAfterMs' in check) {
      return jsonError(429, 'Too many login attempts', undefined, {
        'Retry-After': String(Math.max(1, Math.ceil(check.retryAfterMs / 1000))),
      });
    }
    if (!account || !verifyPassword(password, account.passwordHash)) {
      const failed = loginLimiter.fail(limiterKey);
      if ('retryAfterMs' in failed && failed.retryAfterMs > 0) {
        return jsonError(429, 'Too many login attempts', undefined, {
          'Retry-After': String(Math.max(1, Math.ceil(failed.retryAfterMs / 1000))),
        });
      }
      return jsonError(401, 'Invalid username or password');
    }
    loginLimiter.success(limiterKey);

    const oldToken = readAuthCookie(request.headers, COOKIE_NAME);
    const oldSessionId = oldToken ? verifyAuthToken(oldToken, secret, { maxAgeMs: SESSION_AGE_MS }) : null;
    if (oldSessionId) sessions.delete(oldSessionId);
    const sessionId = randomUUID();
    const expiresAt = Date.now() + SESSION_AGE_MS;
    sessions.set(sessionId, { userId: account.user.id, expiresAt });
    const token = signAuthToken(sessionId, secret);
    return Response.json(account.user, {
      status: 200,
      headers: { 'Set-Cookie': jsonCookie(token, secret) },
    });
  }

  async function upload(request: Request, user: User, tab: string): Promise<Response> {
    const bytes = await boundedBody(request, MAX_REQUEST_BYTES);
    let form: FormData;
    try {
      const headers = new Headers();
      const contentType = request.headers.get('content-type');
      if (contentType) headers.set('content-type', contentType);
      form = await new Request(request.url, { method: 'POST', headers, body: new Uint8Array(bytes) }).formData();
    } catch {
      throw new HttpError(400, 'Invalid multipart form data');
    }
    if (form.getAll('files').length > MAX_FILE_COUNT) {
      throw new HttpError(413, `At most ${MAX_FILE_COUNT} files may be uploaded at once`, 'too_many_files');
    }

    return withUserLock(user.id, async () => {
      const state = await loadState(user.id);
      const requestDir = join(dataDir, '.staging', randomUUID());
      const committedPaths: string[] = [];
      try {
        const files = await handleMultipartUpload(form, requestDir, {
          maxSizeBytes: MAX_FILE_BYTES,
          accept: ACCEPT,
        });
        await mkdir(uploadDir, { recursive: true });
        const added: StoredFile[] = [];
        for (const file of files) {
          const id = randomUUID();
          const path = join(uploadDir, `${id}.bin`);
          await rename(file.path, path);
          committedPaths.push(path);
          added.push({
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            windowId: tab,
          });
        }
        const next = { files: [...state.files, ...added], lifetimeUploads: state.lifetimeUploads + added.length };
        await saveState(user.id, next);
        return Response.json(toUploadList(next, tab), { status: 201 });
      } catch (error) {
        await Promise.all(committedPaths.map((path) => rm(path, { force: true })));
        if (error instanceof UploadError) throw new HttpError(error.status, error.message, error.code);
        throw error;
      } finally {
        await rm(requestDir, { recursive: true, force: true });
      }
    });
  }

  function toUploadList(state: UserState, tab: string): UploadList {
    return {
      files: state.files.filter((file) => file.windowId === tab).map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: file.uploadedAt,
      })),
      lifetimeUploads: state.lifetimeUploads,
    };
  }

  async function uploads(request: Request): Promise<Response> {
    if (!['GET', 'POST'].includes(request.method)) {
      return jsonError(405, 'Method not allowed', undefined, { Allow: 'GET, POST' });
    }
    const guarded = guardedUser(request);
    if (guarded instanceof Response) return guarded;
    const tab = windowId(request);
    if (tab instanceof Response) return tab;
    if (request.method === 'POST') return upload(request, guarded.user, tab);
    const list = await withUserLock(guarded.user.id, async () => toUploadList(await loadState(guarded.user.id), tab));
    return Response.json(list);
  }

  function safeId(raw: string): string | null {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw) ? raw : null;
  }

  async function uploadItem(request: Request, rawId: string, content: boolean): Promise<Response> {
    const guarded = guardedUser(request);
    if (guarded instanceof Response) return guarded;
    const tab = windowId(request);
    if (tab instanceof Response) return tab;
    const id = safeId(rawId);
    if (!id) return jsonError(404, 'Upload not found');

    if (content && request.method === 'GET') {
      return withUserLock(guarded.user.id, async () => {
        const state = await loadState(guarded.user.id);
        const file = state.files.find((item) => item.id === id && item.windowId === tab);
        if (!file) return jsonError(404, 'Upload not found');
        try {
          const bytes = await readFile(join(uploadDir, `${id}.bin`));
          return new Response(bytes, {
            headers: {
              'Content-Type': safeContentType(file.type),
              'Content-Disposition': `attachment; filename*=UTF-8''${attachmentName(file.name)}`,
              'Content-Length': String(bytes.byteLength),
              'X-Content-Type-Options': 'nosniff',
            },
          });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return jsonError(404, 'Upload not found');
          throw error;
        }
      });
    }
    if (!content && request.method === 'DELETE') {
      return withUserLock(guarded.user.id, async () => {
        const state = await loadState(guarded.user.id);
        const index = state.files.findIndex((item) => item.id === id && item.windowId === tab);
        if (index < 0) return jsonError(404, 'Upload not found');
        const filePath = join(uploadDir, `${id}.bin`);
        const next = { ...state, files: state.files.filter((_, i) => i !== index) };
        await saveState(guarded.user.id, next);
        try {
          await unlink(filePath);
        } catch {
          // Blob cleanup is best-effort after the logical delete commits.
        }
        return new Response(null, { status: 204 });
      });
    }
    return jsonError(405, 'Method not allowed', undefined, { Allow: content ? 'GET' : 'DELETE' });
  }

  async function staticFile(request: Request, url: URL): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonError(405, 'Method not allowed', undefined, { Allow: 'GET, HEAD' });
    }
    let relative: string;
    try {
      relative = decodeURIComponent(url.pathname.slice(1));
    } catch {
      return jsonError(404, 'Not found');
    }
    if (!relative) relative = 'index.html';
    const path = resolve(assetsDir, relative);
    if (!isInside(assetsDir, path)) return jsonError(404, 'Not found');
    const file = Bun.file(path);
    if (!(await file.exists())) return jsonError(404, 'Not found');
    const headers = { 'Content-Type': mimeType(path), 'X-Content-Type-Options': 'nosniff' };
    return request.method === 'HEAD' ? new Response(null, { headers }) : new Response(file, { headers });
  }

  async function fetch(request: Request, clientAddress?: string): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD' && !sameOrigin(request)) {
      return jsonError(403, 'Origin does not match this server');
    }

    try {
      if (url.pathname === '/api/health') {
        return request.method === 'GET'
          ? Response.json({ status: 'ok' })
          : jsonError(405, 'Method not allowed', undefined, { Allow: 'GET' });
      }
      if (url.pathname === '/api/login') return await login(request, clientAddress);
      if (url.pathname === '/api/session') {
        if (request.method !== 'GET') return jsonError(405, 'Method not allowed', undefined, { Allow: 'GET' });
        const resolved = resolveSession(request.headers);
        return resolved ? Response.json(resolved.user) : jsonError(401, 'Sign in required');
      }
      if (url.pathname === '/api/logout') {
        if (request.method !== 'POST') return jsonError(405, 'Method not allowed', undefined, { Allow: 'POST' });
        const guarded = guardedUser(request);
        if (guarded instanceof Response) return guarded;
        sessions.delete(guarded.sessionId);
        return new Response(null, { status: 204, headers: { 'Set-Cookie': clearCookie() } });
      }
      if (url.pathname === '/api/uploads') return await uploads(request);
      const contentMatch = /^\/api\/uploads\/([^/]+)\/content$/.exec(url.pathname);
      if (contentMatch) return await uploadItem(request, contentMatch[1]!, true);
      const itemMatch = /^\/api\/uploads\/([^/]+)$/.exec(url.pathname);
      if (itemMatch) return await uploadItem(request, itemMatch[1]!, false);
      if (url.pathname.startsWith('/api/')) return jsonError(404, 'API endpoint not found');
      return await staticFile(request, url);
    } catch (error) {
      if (error instanceof HttpError) return jsonError(error.status, error.message, error.code);
      if (error instanceof UploadError) return jsonError(error.status, error.message, error.code);
      return jsonError(500, 'Internal server error');
    }
  }

  return { fetch, dataDir, assetsDir };
}

export function defaultWorkflowPaths(): { dataDir: string; assetsDir: string } {
  const root = resolve(import.meta.dir, '..');
  return { dataDir: join(root, '.data'), assetsDir: join(root, 'web', 'uploads-dist') };
}
