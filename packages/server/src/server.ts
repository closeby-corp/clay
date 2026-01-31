import type { Server, WebSocketHandler } from "bun";
import { pageRegistry, Client } from "@ralph/core";
import { PageTemplate, type PageTemplateOptions } from "./template";

export interface RalphServerConfig {
  port?: number;
  title?: string;
  theme?: PageTemplateOptions['theme'];
}

// Per-client state
export interface RalphWebSocketData {
  client?: Client;
}

export class RalphServer {
  private server: Server<RalphWebSocketData> | null = null;
  private port: number;
  private template: PageTemplate;

  constructor(config: RalphServerConfig = {}) {
    this.port = config.port || 3000;
    this.template = new PageTemplate({
      title: config.title || 'Ralph UI App',
      theme: config.theme || 'light'
    });
  }

  start() {
    const websocketHandler: WebSocketHandler<RalphWebSocketData> = {
      open(ws) {
        const client = new Client({
          send: (data) => ws.send(data)
        });
        ws.data.client = client;
        console.log(`Client connected: ${client.id}`);

        // Send welcome message
        client.send({ type: 'welcome', id: client.id });
      },
      message(ws, message) {
        const client = ws.data.client;
        if (client) {
          try {
            const text = typeof message === 'string' ? message : new TextDecoder().decode(message);
            const data = JSON.parse(text);
            client.handleMessage(data);
          } catch (e) {
            console.error("Error processing message:", e);
          }
        }
      },
      close(ws, code, message) {
        const client = ws.data.client;
        if (client) {
          console.log(`Client disconnected: ${client.id}`);
          client.destroy();
        }
      },
    };

    this.server = Bun.serve<RalphWebSocketData>({
      port: this.port,
      fetch: this.handleRequest.bind(this),
      websocket: websocketHandler,
    });

    console.log(`Ralph Server running at http://localhost:${this.server.port}`);
    return this.server;
  }

  stop() {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
  }

  private handleRequest(req: Request, server: Server<RalphWebSocketData>): Response | Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/ralph-ws") {
      const success = server.upgrade(req, { data: {} });
      if (success) {
        // Bun automatically returns a 101 Switching Protocols response
        return undefined as any;
      }
      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    if (url.pathname === "/") {
      return new Response(this.template.render(`
        <div class="hero min-h-screen bg-base-200">
          <div class="hero-content text-center">
            <div class="max-w-md">
              <h1 class="text-5xl font-bold">Ralph UI</h1>
              <p class="py-6">Server-driven UI framework for TypeScript</p>
              <p class="text-sm opacity-70">Powered by Bun + HTMX + DaisyUI</p>
            </div>
          </div>
        </div>
      `), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Check page registry
    const PageClass = pageRegistry.get(url.pathname);
    if (PageClass) {
      const page = new PageClass();
      return new Response(this.template.render(page.render()), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  }

  /**
   * Set the page title
   */
  setTitle(title: string): void {
    this.template.setTitle(title);
  }

  /**
   * Set the theme
   */
  setTheme(theme: PageTemplateOptions['theme']): void {
    this.template.setTheme(theme);
  }
}
