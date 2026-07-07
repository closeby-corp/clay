import type { Server } from "bun";
import {
  pageRegistry,
  eventRegistry,
  RenderContext,
  runWithContext,
  extractMetaSignalsLegacy,
  META_DS_VAL_KEY,
  setGlobalStreamPatcher,
} from "@badui/core";
import { PageTemplate, type PageTemplateOptions } from "./template";
import { readBadUISignals, BadRequestError } from "./datastar";
import { patchResponse } from "./patch-response";
import { createStreamResponse, signalStreamRegistry } from "./signal-stream";

export interface BadUIServerConfig {
  port?: number;
  title?: string;
  theme?: PageTemplateOptions['theme'];
}

const clientContexts = new Map<string, RenderContext>();
const CONTEXT_TTL_MS = 30 * 60 * 1000;
const contextExpiry = new Map<string, ReturnType<typeof setTimeout>>();

function touchContext(ctxId: string): void {
  const existing = contextExpiry.get(ctxId);
  if (existing) clearTimeout(existing);
  contextExpiry.set(
    ctxId,
    setTimeout(() => {
      signalStreamRegistry.close(ctxId);
      clientContexts.get(ctxId)?.destroy();
      clientContexts.delete(ctxId);
      contextExpiry.delete(ctxId);
    }, CONTEXT_TTL_MS),
  );
}

function wireContextStream(context: RenderContext): void {
  context.setStreamSender((patch) => {
    signalStreamRegistry.patch(context.id, patch);
  });
}

setGlobalStreamPatcher((ctxId, patch) => {
  signalStreamRegistry.patch(ctxId, patch);
});

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
      for (const ctxId of signalStreamRegistry.getActiveIds()) {
        signalStreamRegistry.close(ctxId);
      }
      for (const ctx of clientContexts.values()) {
        ctx.destroy();
      }
      clientContexts.clear();
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
      const ctx = clientContexts.get(contextId)!;
      touchContext(contextId);
      return ctx;
    }
    const newId = contextId || crypto.randomUUID();
    const context = new RenderContext(newId, {
      send: () => {},
    });
    wireContextStream(context);
    clientContexts.set(newId, context);
    touchContext(newId);
    return context;
  }

  private handleRequest(req: Request): Response | Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/badui/stream") {
      return this.handleStream(req, url);
    }

    if (req.method === "POST" && url.pathname === "/badui/events") {
      return this.handleEvent(req);
    }

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

    const createPage = pageRegistry.get(url.pathname);
    if (createPage) {
      const context = this.getOrCreateContext();
      this.initializePage(context, url.pathname);

      const page = context.getPage();
      const html = page ? runWithContext(context, () => {
        context.beginRender();
        return page.render();
      }) : '';

      const initialSignals = context.exportInitialSignals();

      return new Response(this.template.render(html, context.id, initialSignals), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  }

  private handleStream(_req: Request, url: URL): Response {
    const ctxId = url.searchParams.get("ctxId");
    if (!ctxId || !clientContexts.has(ctxId)) {
      return new Response("Unknown context", { status: 404 });
    }
    touchContext(ctxId);
    return createStreamResponse(ctxId, () => {
      clientContexts.get(ctxId)?.destroy();
      clientContexts.delete(ctxId);
      contextExpiry.delete(ctxId);
    });
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

  private async handleEvent(req: Request): Promise<Response> {
    let signals: Record<string, unknown>;
    try {
      signals = await readBadUISignals(req) as Record<string, unknown>;
    } catch (e) {
      if (e instanceof BadRequestError) {
        return new Response(e.message, { status: 400 });
      }
      return new Response("Invalid request", { status: 400 });
    }

    const meta = extractMetaSignalsLegacy(signals);
    const { compId: componentId, evtType: eventType, ctxId: contextId, dsValKey } = meta;

    if (!componentId || !eventType) {
      return new Response("Missing component or event", { status: 400 });
    }

    const handler = eventRegistry.getHandler(componentId, eventType);
    if (!handler) {
      return new Response("No handler", { status: 404 });
    }

    const context = contextId ? clientContexts.get(contextId) : null;

    const valKey = dsValKey ?? (signals[META_DS_VAL_KEY] as string | undefined);
    const valueSignal = valKey
      ? (signals[valKey] as string | undefined)
      : (signals.value as string | undefined);

    if (context) {
      touchContext(context.id);
      context.suppressRerender(true);
      context.importSignals(signals);

      await runWithContext(context, async () => {
        await handler({ value: valueSignal, formData: null, signals });
      });

      context.suppressRerender(false);

      const dirty = context.getDirtyKind();
      const exported = context.exportSignals();
      context.beginRender();

      const patch: Parameters<typeof patchResponse>[0] = { signals: exported };

      if (dirty === 'elements' || dirty === 'both') {
        const page = context.getPage();
        const renderFn = context.getRenderFn();
        if (page && renderFn) {
          const html = runWithContext(context, () => renderFn());
          patch.elements = `<div id="app" class="w-full">${html}</div>`;
          patch.selector = '#app';
          patch.useViewTransition = true;
        }
      }

      return patchResponse(patch);
    }

    await handler({ value: valueSignal, formData: null, signals });
    return patchResponse({});
  }
}
