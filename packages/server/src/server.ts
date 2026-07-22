import type { Server } from "bun";
import type { PatchBus, StreamWriter } from "@badui/core";
import {
  pageRegistry,
  eventRegistry,
  RenderContext,
  runWithContext,
  extractMetaSignalsLegacy,
  META_DS_VAL_KEY,
  setGlobalStreamPatcher,
} from "@badui/core";
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web";
import { PageTemplate, type PageTemplateOptions } from "./template";
import { readBadUISignals, BadRequestError } from "./datastar";
import { patchResponse } from "./patch-response";
import { defaultInMemoryPatchBus } from "./signal-stream";

export interface BadUIServerConfig {
  port?: number;
  title?: string;
  theme?: PageTemplateOptions['theme'];
  patchBus?: PatchBus;
}

const clientContexts = new Map<string, RenderContext>();
const CONTEXT_TTL_MS = 30 * 60 * 1000;
const contextExpiry = new Map<string, ReturnType<typeof setTimeout>>();

function touchContext(ctxId: string, bus: PatchBus): void {
  const existing = contextExpiry.get(ctxId);
  if (existing) clearTimeout(existing);
  contextExpiry.set(
    ctxId,
    setTimeout(() => {
      bus.close(ctxId);
      clientContexts.get(ctxId)?.destroy();
      clientContexts.delete(ctxId);
      contextExpiry.delete(ctxId);
    }, CONTEXT_TTL_MS),
  );
}

function wireContextStream(context: RenderContext, bus: PatchBus): void {
  context.setStreamSender((patch) => {
    bus.publish(context.id, patch);
  });
}

export class BadUIServer {
  private server: Server | null = null;
  private port: number;
  private template: PageTemplate;
  private patchBus: PatchBus;

  constructor(config: BadUIServerConfig = {}) {
    this.port = config.port || 3000;
    this.patchBus = config.patchBus ?? defaultInMemoryPatchBus;
    this.template = new PageTemplate({
      title: config.title || 'BadUI App',
      theme: config.theme || 'nord'
    });

    setGlobalStreamPatcher((ctxId, patch) => {
      this.patchBus.publish(ctxId, patch);
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
      for (const ctxId of this.patchBus.getActiveIds()) {
        this.patchBus.close(ctxId);
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
      touchContext(contextId, this.patchBus);
      return ctx;
    }
    const newId = contextId || crypto.randomUUID();
    const context = new RenderContext(newId, {
      send: () => {},
    });
    wireContextStream(context, this.patchBus);
    clientContexts.set(newId, context);
    touchContext(newId, this.patchBus);
    return context;
  }

  private handleRequest(req: Request): Response | Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/badui/stream") {
      return this.handleStream(url);
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
      const initialSignals = context.exportInitialSignals();

      // Include pre-rendered content in initial response (no spinner).
      // SSE stream is used for subsequent reactive updates.
      const content = context._initialHtml || '';
      return new Response(this.template.render(content, context.id, initialSignals), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  }

  private handleStream(url: URL): Response {
    const ctxId = url.searchParams.get("ctxId");
    if (!ctxId || !clientContexts.has(ctxId)) {
      return new Response("Unknown context", { status: 404 });
    }
    touchContext(ctxId, this.patchBus);

    const abort = new AbortController();

    return ServerSentEventGenerator.stream((writer) => {
      this.patchBus.subscribe(ctxId, writer as StreamWriter, abort);

      const context = clientContexts.get(ctxId);
      if (context) {
        if (context._initialHtml) {
          (writer as StreamWriter).patchElements(
            `<div id="app" class="w-full">${context._initialHtml}</div>`,
            { selector: '#app', useViewTransition: true },
          );
          context._initialHtml = null;
        }
        const signals = context.exportSignals();
        if (Object.keys(signals).length > 0) {
          (writer as StreamWriter).patchSignals(JSON.stringify(signals));
        }
      }

      const heartbeat = setInterval(() => {
        try {
          (writer as StreamWriter).keepalive();
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      abort.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        this.patchBus.unsubscribe(ctxId);
        clientContexts.get(ctxId)?.destroy();
        clientContexts.delete(ctxId);
        contextExpiry.delete(ctxId);
      });
    });
  }

  private initializePage(context: RenderContext, path: string): void {
    const createPage = pageRegistry.get(path);
    if (!createPage) return;

    context.beginRender();
    runWithContext(context, () => {
      const page = createPage();
      const renderFn = () => {
        context.beginRender();
        return runWithContext(context, () => page.render());
      };
      context.setPage(page, renderFn);

      try {
        const html = renderFn();
        context._initialHtml = html;
      } catch (err) {
        console.error(`[BadUI] Error rendering page ${path}:`, err);
        context._initialHtml = '';
      }
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
      touchContext(context.id, this.patchBus);
      context.suppressRerender(true);
      context.importSignals(signals);

      await runWithContext(context, async () => {
        await handler({ value: valueSignal, formData: null, signals });
      });

      context.suppressRerender(false);

      const exported = context.exportSignals();
      const needsElementRender = context.isElementDirty();
      context.beginRender();

      const patch: Parameters<typeof patchResponse>[0] = { signals: exported };

      if (needsElementRender) {
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
