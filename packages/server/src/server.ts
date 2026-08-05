import { ClientSession, getRegisteredPaths, type ClientMessage } from '@badui/core';
import { isAbsolute, join, resolve } from 'path';

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
};

const DEFAULT_CLIENT_DIR = join(import.meta.dir, '../../client/dist');

function normalizeCssPaths(css?: string | string[]): string[] {
  if (!css) return [];
  const list = Array.isArray(css) ? css : [css];
  return list
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (isAbsolute(p) ? p : resolve(process.cwd(), p)));
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
    };
  }

  /** Bound listen port (after `start`), or configured port. */
  get port(): number {
    return this.server?.port ?? this.config.port;
  }

  start(): ReturnType<typeof Bun.serve> {
    const { port, title, clientDir, cssPaths } = this.config;
    const customCssHrefs = cssPaths.map((_, i) => `/assets/custom-${i}.css`);
    const html = spaHtml(title, customCssHrefs);

    this.server = Bun.serve({
      port,
      async fetch(req, server) {
        const url = new URL(req.url);

        if (url.pathname === '/ws') {
          const upgraded = server.upgrade(req, {
            data: { session: null as ClientSession | null },
          });
          if (!upgraded) {
            return new Response('WebSocket upgrade failed', { status: 400 });
          }
          return undefined as unknown as Response;
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
        open(ws) {
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

          const data = ws.data as { session: ClientSession | null };

          if (msg.op === 'hello') {
            data.session?.destroy();
            const session = new ClientSession(msg.path, (out) => {
              try {
                ws.send(JSON.stringify(out));
              } catch {
                // socket closed
              }
            });
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
