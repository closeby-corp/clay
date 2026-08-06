import { ClientSession, getRegisteredPaths, storage, type ClientMessage } from '@badui/core';
import { createFilePersistence } from '@badui/persistence-file';
import { isAbsolute, join, resolve } from 'path';
import { handleMultipartUpload, UploadError } from './upload';

export type ResolveUserIdContext = {
  /** Raw `userId` from the client hello (localStorage), if any. */
  helloUserId?: string;
  /** Upgrade request headers (cookie, authorization, …). */
  headers: Headers;
  path: string;
};

export type BadUIServerConfig = {
  port?: number;
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
   * Absolute or relative to `process.cwd()`. Default: `.badui-uploads`.
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
   * Absolute or relative to `process.cwd()`. Default: `.badui-user-data`.
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
   */
  resolveUserId?: (
    ctx: ResolveUserIdContext,
  ) => string | null | undefined | Promise<string | null | undefined>;
};

const DEFAULT_CLIENT_DIR = join(import.meta.dir, '../../client/dist');
const DEFAULT_UPLOAD_DIR = '.badui-uploads';
const DEFAULT_USER_STORAGE_DIR = '.badui-user-data';

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
  resolveUserId?: BadUIServerConfig['resolveUserId'];
};

export class BadUIServer {
  private config: ResolvedConfig;
  private server: ReturnType<typeof Bun.serve> | null = null;

  constructor(config: BadUIServerConfig = {}) {
    this.config = {
      port: config.port ?? 3000,
      title: config.title ?? 'BadUI',
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
      resolveUserId: config.resolveUserId,
    };

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
    } = this.config;
    const customCssHrefs = cssPaths.map((_, i) => `/assets/custom-${i}.css`);
    const html = spaHtml(title, customCssHrefs);

    this.server = Bun.serve({
      port,
      async fetch(req, server) {
        const url = new URL(req.url);

        if (url.pathname === '/ws') {
          const upgraded = server.upgrade(req, {
            data: {
              session: null as ClientSession | null,
              headers: req.headers,
            },
          });
          if (!upgraded) {
            return new Response('WebSocket upgrade failed', { status: 400 });
          }
          return undefined as unknown as Response;
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

          const data = ws.data as {
            session: ClientSession | null;
            headers?: Headers;
          };

          if (msg.op === 'hello') {
            data.session?.destroy();
            const session = new ClientSession(msg.path, (out) => {
              try {
                ws.send(JSON.stringify(out));
              } catch {
                // socket closed
              }
            });

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
            data.session = session;
            session.mount();
            return;
          }

          if (data.session) {
            // Do not await: allow concurrent events so await ui.confirm/prompt/choose can resolve
            void data.session.handleMessage(msg).catch((err: unknown) => {
              console.error(err);
              const message = err instanceof Error ? err.message : String(err);
              data.session?.notify(message, 'error');
            });
          }
        },
        close(ws) {
          const data = ws.data as { session: ClientSession | null };
          data.session?.destroy();
          data.session = null;
        },
      },
    });

    console.log(`BadUI server listening on http://localhost:${this.port}`);
    console.log(`Registered pages: ${getRegisteredPaths().join(', ') || '(none)'}`);
    if (cssPaths.length) {
      console.log(`Custom CSS: ${cssPaths.join(', ')}`);
    }
    return this.server;
  }

  stop(): void {
    this.server?.stop();
    this.server = null;
  }
}
