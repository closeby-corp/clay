import type { Server } from "bun";
import { pageRegistry, eventRegistry, RenderContext, runWithContext } from "@badui/core";
import { PageTemplate, type PageTemplateOptions } from "./template";

export interface BadUIServerConfig {
  port?: number;
  title?: string;
  theme?: PageTemplateOptions['theme'];
}

const clientContexts = new Map<string, RenderContext>();

export class BadUIServer {
  private server: Server | null = null;
  private port: number;
  private template: PageTemplate;

  constructor(config: BadUIServerConfig = {}) {
    this.port = config.port || 3000;
    this.template = new PageTemplate({
      title: config.title || 'BadUI App',
      theme: config.theme || 'nord'
    });
  }

  start() {
    this.server = Bun.serve({
      port: this.port,
      fetch: this.handleRequest.bind(this),
    });

    console.log(`[BadUI] Server running at http://localhost:${this.server.port}`);
    return this.server;
  }

  stop() {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
  }

  setTitle(title: string): void {
    this.template.setTitle(title);
  }

  setTheme(theme: PageTemplateOptions['theme']): void {
    this.template.setTheme(theme);
  }

  private getOrCreateContext(contextId?: string | null): RenderContext {
    if (contextId && clientContexts.has(contextId)) {
      return clientContexts.get(contextId)!;
    }
    const newId = contextId || crypto.randomUUID();
    const context = new RenderContext(newId, {
      send: () => {} // No-op; re-renders happen in event response HTML
    });
    clientContexts.set(newId, context);
    return context;
  }

  private handleRequest(req: Request): Response | Promise<Response> {
    const url = new URL(req.url);

    // Event handling (user interactions via DataStar @post actions)
    if (req.method === "POST" && url.pathname === "/badui/events") {
      return this.handleEvent(req);
    }

    // Root page
    if (url.pathname === "/") {
      return new Response(this.template.render(`
        <div class="hero min-h-screen bg-base-200">
          <div class="hero-content text-center">
            <div class="max-w-md">
              <h1 class="text-5xl font-bold">BadUI</h1>
              <p class="py-6">Server-driven UI framework for TypeScript</p>
              <p class="text-sm opacity-70">Powered by Bun + Datastar + DaisyUI</p>
            </div>
          </div>
        </div>
      `), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Registered page routes
    const createPage = pageRegistry.get(url.pathname);
    if (createPage) {
      const context = this.getOrCreateContext();
      this.initializePage(context, url.pathname);

      const page = context.getPage();
      const html = page ? runWithContext(context, () => {
        context.beginRender();
        return page.render();
      }) : '';

      return new Response(this.template.render(html, context.id), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  }

  private initializePage(context: RenderContext, path: string): void {
    const createPage = pageRegistry.get(path);
    if (!createPage) return;

    context.beginRender();
    runWithContext(context, () => {
      const page = createPage();
      context.setPage(page, () => {
        context.beginRender();
        return runWithContext(context, () => page.render());
      });
    });
  }

  /**
   * Handle user interaction events sent via DataStar @post() actions.
   * Reads signals from the request, dispatches the event handler,
   * re-renders the page, and returns text/html for DataStar to morph.
   *
   * DataStar's @post() action handles text/html responses by morphing
   * the returned HTML elements into the DOM based on element IDs.
   * It also handles JSON responses by patching signals.
   */
  private async handleEvent(req: Request): Promise<Response> {
    // Parse JSON body sent by DataStar's @post action
    let signals: Record<string, any>;
    try {
      signals = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const componentId = signals.compId as string;
    const eventType = signals.evtType as string;
    const contextId = signals.ctxId as string | undefined;

    if (!componentId || !eventType) {
      return new Response("Missing component or event", { status: 400 });
    }

    const handler = eventRegistry.getHandler(componentId, eventType);
    if (!handler) {
      return new Response("No handler", { status: 404 });
    }

    const context = contextId ? clientContexts.get(contextId) : null;

    const valueSignal = signals.dsValKey
      ? (signals[signals.dsValKey as string] as string | undefined)
      : (signals.value as string | undefined);

    if (context) {
      // Suppress re-renders during event dispatch so ValueComponent value
      // changes (e.g., textInput.value = '') don't trigger microtask
      // re-renders between the handler and the response render.
      context.suppressRerender(true);
      context.syncValueComponentsFromSignals(signals);

      await runWithContext(context, async () => {
        await handler({ value: valueSignal, formData: null, signals });
      });

      const page = context.getPage();
      if (page) {
        context.suppressRerender(false);
        context.beginRender();

        const html = runWithContext(context, () => page.render());

        // Reset stale data-bind signals on client
        const valKey = signals.dsValKey as string | undefined;
        const signalsAttr = valKey
          ? ` data-signals='{"${valKey}":""}'`
          : '';
        return new Response(`<div id="app" class="w-full"${signalsAttr}>${html}</div>`, {
          headers: { "Content-Type": "text/html" },
        });
      }
    } else {
      await handler({ value: valueSignal, formData: null, signals });
    }

    return new Response("OK", { status: 200 });
  }
}
