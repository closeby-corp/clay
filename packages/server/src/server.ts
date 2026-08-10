import { ClientSession, getRegisteredPaths, runWithSession, setCurrentSession, storage, type ClientMessage } from '@clay/core';
import { createFilePersistence } from '@clay/persistence-file';
import { isAbsolute, join, resolve } from 'path';
import {
  handleAuthSessionDelete,
  handleAuthSessionPost,
  resolveUserIdFromAuthCookie,
} from './auth-cookie';
import { clearAuthSession, configureAuthSession } from './auth-session';
import { handleMultipartUpload, UploadError } from './upload';

/** JSON-serializable values only (skip functions / circular / exotic objects). */
function isJsonSafeStorageValue(value: unknown): boolean {
  if (value === null) return true;
  const t = typeof value;
  if (t === 'string' || t === 'boolean') return true;
  if (t === 'number') return Number.isFinite(value);
  if (t !== 'object') return false;
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

export type ResolveUserIdContext = {
  /** Raw `userId` from the client hello (localStorage), if any. */
  helloUserId?: string;
  /** Upgrade request headers (cookie, authorization, …). */
  headers: Headers;
  /** SPA path from the hello message. */
  path: string;
};

/**
 * Config for {@link ClayServer} / `ui.run`.
 * Auth, session timeouts, uploads, and storage directories live here.
 */
export type ClayServerConfig = {
  /** Listen port. Default `3000`. */
  port?: number;
  /** HTML `<title>`. Default `"Clay"`. */
  title?: string;
  /** Absolute or workspace-relative path to built client assets. */
  clientDir?: string;
  /**
   * Extra stylesheet path(s) injected after the built client CSS.
   * Absolute paths, or relative to `process.cwd()`.
   */
  css?: string | string[];
  /**
   * Directory for `POST /upload` files.
   * Absolute or relative to `process.cwd()`. Default: `.clay-uploads`.
   */
  uploadDir?: string;
  /** Reject uploads larger than this many bytes (server-side). */
  uploadMaxSizeBytes?: number;
  /**
   * Global `accept` filter for `POST /upload` (HTML accept syntax).
   * Per-widget `accept` is still enforced on the client.
   */
  uploadAccept?: string;
  /**
   * Directory for per-user JSON bags (`storage.user`).
   * Absolute or relative to `process.cwd()`. Default: `.clay-user-data`.
   * Pass `false` to skip file persistence (in-memory user bags only).
   */
  userStorageDir?: string | false;
  /**
   * Directory for process-wide app stores (`storage.app`).
   * Absolute or relative to `process.cwd()`. Default: `false` (memory-only).
   * Pass a string to enable file persistence for app stores.
   */
  appStorageDir?: string | false;
  /**
   * Resolve a trusted user id on WebSocket hello (e.g. from a signed cookie
   * or reverse-proxy header). Return `null`/`undefined` to fall back to the
   * anonymous localStorage id from the client.
   *
   * When `authSecret` is set and this is omitted, defaults to
   * {@link resolveUserIdFromAuthCookie}.
   */
  resolveUserId?: (
    ctx: ResolveUserIdContext,
  ) => string | null | undefined | Promise<string | null | undefined>;
  /**
   * HMAC secret for signed auth cookies (`POST`/`DELETE /auth/session`).
   * Enables `establishAuthSession` / `clearAuthSession` and, when
   * `resolveUserId` is omitted, cookie-based identity on hello.
   */
  authSecret?: string;
  /** Auth cookie Max-Age in seconds. Default 12 hours. */
  authCookieMaxAgeSec?: number;
  /**
   * Sign out after this many ms without client events.
   * Optional — omit to disable idle expiry.
   */
  sessionIdleMs?: number;
  /**
   * Sign out after this many ms since WebSocket hello.
   * Optional — omit to disable absolute expiry.
   */
  sessionAbsoluteMs?: number;
  /**
   * SPA path after session idle/absolute expiry (clears auth cookie).
   * Default `/`.
   */
  sessionExpiredPath?: string;
};

const DEFAULT_CLIENT_DIR = join(import.meta.dir, '../../client/dist');
const DEFAULT_UPLOAD_DIR = '.clay-uploads';
const DEFAULT_USER_STORAGE_DIR = '.clay-user-data';
const DEFAULT_AUTH_MAX_AGE_SEC = 12 * 60 * 60;
const SESSION_EXPIRY_CHECK_MS = 1_000;

function normalizeCssPaths(css?: string | string[]): string[] {
  if (!css) return [];
  const list = Array.isArray(css) ? css : [css];
  return list
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (isAbsolute(p) ? p : resolve(process.cwd(), p)));
}

function resolveDir(dir: string | undefined, fallback: string): string {
  const raw = dir ?? fallback;
  return isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
}

function spaHtml(title: string, customCssHrefs: string[]): string {
  const customLinks = customCssHrefs
    .map((href) => `  <link rel="stylesheet" href="${href}" />`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="/assets/index.css" />
${customLinks ? `${customLinks}\n` : ''}</head>
<body class="min-h-screen bg-background text-foreground antialiased">
  <div id="root"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>`;
}

type ResolvedConfig = {
  port: number;
  title: string;
  clientDir: string;
  cssPaths: string[];
  uploadDir: string;
  uploadMaxSizeBytes?: number;
  uploadAccept?: string;
  userStorageDir: string | false;
  appStorageDir: string | false;
  resolveUserId?: ClayServerConfig['resolveUserId'];
  authSecret?: string;
  authCookieMaxAgeSec: number;
  sessionIdleMs?: number;
  sessionAbsoluteMs?: number;
  sessionExpiredPath: string;
};

type WsData = {
  session: ClientSession | null;
  headers?: Headers;
  expiryTimer?: ReturnType<typeof setInterval> | null;
};

function clearExpiryTimer(data: WsData): void {
  if (data.expiryTimer) {
    clearInterval(data.expiryTimer);
    data.expiryTimer = null;
  }
}

function expireSession(data: WsData, expiredPath: string): void {
  clearExpiryTimer(data);
  const session = data.session;
  if (!session) return;
  runWithSession(session, () => {
    try {
      clearAuthSession({ path: expiredPath });
    } catch {
      session.authSession('clear', { path: expiredPath });
    }
  });
  setCurrentSession(null);
  session.destroy();
  data.session = null;
}

/**
 * HTTP + WebSocket server for Clay apps.
 * Prefer `ui.run(config)` which constructs and starts this.
 */
export class ClayServer {
  private config: ResolvedConfig;
  private server: ReturnType<typeof Bun.serve> | null = null;

  constructor(config: ClayServerConfig = {}) {
    const authSecret = config.authSecret;
    const authCookieMaxAgeSec = config.authCookieMaxAgeSec ?? DEFAULT_AUTH_MAX_AGE_SEC;
    const sessionExpiredPath = config.sessionExpiredPath ?? '/';

    let resolveUserId = config.resolveUserId;
    if (authSecret && !resolveUserId) {
      resolveUserId = resolveUserIdFromAuthCookie(authSecret, {
        maxAgeMs: authCookieMaxAgeSec * 1000,
      });
    }

    this.config = {
      port: config.port ?? 3000,
      title: config.title ?? 'Clay',
      clientDir: config.clientDir ?? DEFAULT_CLIENT_DIR,
      cssPaths: normalizeCssPaths(config.css),
      uploadDir: resolveDir(config.uploadDir, DEFAULT_UPLOAD_DIR),
      uploadMaxSizeBytes: config.uploadMaxSizeBytes,
      uploadAccept: config.uploadAccept,
      userStorageDir:
        config.userStorageDir === false
          ? false
          : resolveDir(
              typeof config.userStorageDir === 'string' ? config.userStorageDir : undefined,
              DEFAULT_USER_STORAGE_DIR,
            ),
      appStorageDir:
        typeof config.appStorageDir === 'string'
          ? resolveDir(config.appStorageDir, config.appStorageDir)
          : false,
      resolveUserId,
      authSecret,
      authCookieMaxAgeSec,
      sessionIdleMs: config.sessionIdleMs,
      sessionAbsoluteMs: config.sessionAbsoluteMs,
      sessionExpiredPath,
    };

    if (authSecret) {
      configureAuthSession({
        secret: authSecret,
        maxAgeMs: authCookieMaxAgeSec * 1000,
        expiredPath: sessionExpiredPath,
      });
    } else {
      configureAuthSession(null);
    }

    const app =
      this.config.appStorageDir !== false
        ? createFilePersistence({ dir: this.config.appStorageDir })
        : undefined;
    const user =
      this.config.userStorageDir !== false
        ? createFilePersistence({ dir: this.config.userStorageDir })
        : undefined;
    if (app || user) {
      storage.configure({ app, user });
    }
  }

  /** Bound listen port (after `start`), or configured port. */
  get port(): number {
    return this.server?.port ?? this.config.port;
  }

  start(): ReturnType<typeof Bun.serve> {
    const {
      port,
      title,
      clientDir,
      cssPaths,
      uploadDir,
      uploadMaxSizeBytes,
      uploadAccept,
      resolveUserId,
      authSecret,
      authCookieMaxAgeSec,
      sessionIdleMs,
      sessionAbsoluteMs,
      sessionExpiredPath,
    } = this.config;
    const customCssHrefs = cssPaths.map((_, i) => `/assets/custom-${i}.css`);
    const html = spaHtml(title, customCssHrefs);
    const hasTimeouts = sessionIdleMs != null || sessionAbsoluteMs != null;

    this.server = Bun.serve({
      port,
      async fetch(req, server) {
        const url = new URL(req.url);

        if (url.pathname === '/ws') {
          const upgraded = server.upgrade(req, {
            data: {
              session: null as ClientSession | null,
              headers: req.headers,
              expiryTimer: null,
            } satisfies WsData,
          });
          if (!upgraded) {
            return new Response('WebSocket upgrade failed', { status: 400 });
          }
          return undefined as unknown as Response;
        }

        if (url.pathname === '/auth/session' && authSecret) {
          if (req.method === 'POST') {
            return handleAuthSessionPost(req, {
              secret: authSecret,
              maxAgeSec: authCookieMaxAgeSec,
            });
          }
          if (req.method === 'DELETE') {
            return handleAuthSessionDelete();
          }
          return new Response('Method not allowed', { status: 405 });
        }

        if (url.pathname === '/upload' && req.method === 'POST') {
          try {
            const form = await req.formData();
            const files = await handleMultipartUpload(form, uploadDir, {
              maxSizeBytes: uploadMaxSizeBytes,
              accept: uploadAccept,
            });
            return Response.json({ files });
          } catch (err) {
            if (err instanceof UploadError) {
              return Response.json(
                { error: err.message, code: err.code },
                { status: err.status },
              );
            }
            const message = err instanceof Error ? err.message : String(err);
            return Response.json({ error: message }, { status: 500 });
          }
        }

        if (url.pathname.startsWith('/assets/')) {
          const assetName = url.pathname.slice('/assets/'.length);
          const customMatch = /^custom-(\d+)\.css$/.exec(assetName);
          if (customMatch) {
            const idx = Number(customMatch[1]);
            const cssPath = cssPaths[idx];
            if (!cssPath) return new Response('Not found', { status: 404 });
            const file = Bun.file(cssPath);
            if (!(await file.exists())) {
              return new Response('CSS file not found', { status: 404 });
            }
            return new Response(file, {
              headers: { 'Content-Type': 'text/css; charset=utf-8' },
            });
          }

          const filePath = join(clientDir, assetName);
          const file = Bun.file(filePath);
          if (await file.exists()) {
            return new Response(file);
          }
          return new Response('Not found', { status: 404 });
        }

        // SPA: all app routes serve the React shell
        const paths = getRegisteredPaths();
        if (url.pathname === '/' || paths.includes(url.pathname) || url.pathname.startsWith('/examples/')) {
          return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }

        // Fallback SPA for client-side navigation
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      },
      websocket: {
        open(_ws) {
          // wait for hello
        },
        async message(ws, raw) {
          let msg: ClientMessage;
          try {
            msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
          } catch {
            ws.send(JSON.stringify({ op: 'error', message: 'Invalid JSON' }));
            return;
          }

          const data = ws.data as WsData;

          if (msg.op === 'hello') {
            clearExpiryTimer(data);
            data.session?.destroy();
            const session = new ClientSession(msg.path, (out) => {
              try {
                ws.send(JSON.stringify(out));
              } catch {
                // socket closed
              }
            });

            if (hasTimeouts) {
              session.timeouts = {
                idleMs: sessionIdleMs,
                absoluteMs: sessionAbsoluteMs,
              };
            }

            const helloUserId =
              typeof msg.userId === 'string' && msg.userId ? msg.userId : undefined;
            let userId = helloUserId;
            if (resolveUserId) {
              try {
                const trusted = await resolveUserId({
                  helloUserId,
                  headers: data.headers ?? new Headers(),
                  path: msg.path,
                });
                if (typeof trusted === 'string' && trusted) {
                  userId = trusted;
                }
              } catch (err) {
                console.error('[resolveUserId]', err);
              }
            }
            if (userId) session.userId = userId;

            if (msg.browserStorage && typeof msg.browserStorage === 'object') {
              for (const [k, v] of Object.entries(msg.browserStorage)) {
                session.browser.set(k, v);
              }
            }
            if (msg.clientStorage && typeof msg.clientStorage === 'object') {
              for (const [k, v] of Object.entries(msg.clientStorage)) {
                session.client.set(k, v);
              }
            }
            if (msg.tabStorage && typeof msg.tabStorage === 'object') {
              for (const [k, v] of Object.entries(msg.tabStorage)) {
                if (isJsonSafeStorageValue(v)) session.tab.set(k, v);
              }
            }
            data.session = session;
            session.mount();

            if (hasTimeouts) {
              data.expiryTimer = setInterval(() => {
                const current = data.session;
                if (!current || !current.isExpired()) return;
                expireSession(data, sessionExpiredPath);
              }, SESSION_EXPIRY_CHECK_MS);
            }
            return;
          }

          if (data.session) {
            if (data.session.isExpired()) {
              expireSession(data, sessionExpiredPath);
              return;
            }
            data.session.touch();
            // Do not await: allow concurrent events so await ui.confirm/prompt/choose can resolve
            void data.session.handleMessage(msg).catch((err: unknown) => {
              console.error(err);
              const message = err instanceof Error ? err.message : String(err);
              data.session?.notify(message, 'error');
            });
          }
        },
        close(ws) {
          const data = ws.data as WsData;
          clearExpiryTimer(data);
          data.session?.destroy();
          data.session = null;
        },
      },
    });

    console.log(`Clay server listening on http://localhost:${this.port}`);
    console.log(`Registered pages: ${getRegisteredPaths().join(', ') || '(none)'}`);
    if (cssPaths.length) {
      console.log(`Custom CSS: ${cssPaths.join(', ')}`);
    }
    if (authSecret) {
      console.log('Auth session routes: POST/DELETE /auth/session');
    }
    return this.server;
  }

  stop(): void {
    configureAuthSession(null);
    this.server?.stop();
    this.server = null;
  }
}
