import { DATATABLE_CLIENT_SCRIPT } from './datatable-client';

export interface PageTemplateOptions {
  title?: string;
  theme?: 'light' | 'dark' | 'cupcake' | 'bumblebee' | 'emerald' | 'corporate' | 'synthwave' | 'retro' | 'cyberpunk' | 'valentine' | 'halloween' | 'garden' | 'forest' | 'aqua' | 'lofi' | 'pastel' | 'fantasy' | 'wireframe' | 'black' | 'luxury' | 'dracula' | 'cmyk' | 'autumn' | 'business' | 'acid' | 'lemonade' | 'night' | 'coffee' | 'winter' | 'dim' | 'nord' | 'sunset';
  content?: string;
  contextId?: string | null;
  initialSignals?: Record<string, unknown>;
}

function escapeJsonForAttr(obj: Record<string, unknown>): string {
  return JSON.stringify(obj).replace(/'/g, '&#39;');
}

function buildHead(title: string, theme: string): string {
  return `<!DOCTYPE html>
<html data-theme="${theme}" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5/themes.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@v1.0.2/bundles/datastar.js"></script>
  <style>
    input:focus, textarea:focus, select:focus {
      outline: 2px solid oklch(var(--p));
      outline-offset: 2px;
    }
  </style>
</head>
<body class="min-h-screen bg-base-100">`;
}

function buildFoot(): string {
  return `<script>${DATATABLE_CLIENT_SCRIPT}</script></body></html>`;
}

export function generatePageHTML(options: PageTemplateOptions = {}): string {
  const {
    title = 'BadUI App',
    theme = 'light',
    content = '',
    contextId = null,
    initialSignals = {},
  } = options;

  const signals: Record<string, unknown> = { ...initialSignals };
  if (contextId && !signals.ctxId) {
    signals.ctxId = contextId;
  }

  const signalsAttr = Object.keys(signals).length > 0
    ? ` data-signals='${escapeJsonForAttr(signals)}'`
    : '';

  const streamConnect = contextId
    ? `<div id="badui-stream" class="hidden" data-on-load="@get('/badui/stream?ctxId=${contextId}')"></div>`
    : '';

  return `${buildHead(title, theme)}
  ${streamConnect}
  <div id="app" class="w-full"${signalsAttr}>
    ${content}
  </div>
  ${buildFoot()}`;
}

/**
 * Render only the HTML shell — no page content, just a loading placeholder.
 * The actual content is pushed via SSE when the stream connects.
 */
export function generateShellHTML(options: PageTemplateOptions = {}): string {
  const {
    title = 'BadUI App',
    theme = 'light',
    contextId = null,
    initialSignals = {},
  } = options;

  const signals: Record<string, unknown> = { ...initialSignals };
  if (contextId && !signals.ctxId) {
    signals.ctxId = contextId;
  }

  const signalsAttr = Object.keys(signals).length > 0
    ? ` data-signals='${escapeJsonForAttr(signals)}'`
    : '';

  const streamConnect = contextId
    ? `<div id="badui-stream" class="hidden" data-on-load="@get('/badui/stream?ctxId=${contextId}')"></div>`
    : '';

  const loadingHtml = `<div class="flex items-center justify-center min-h-[60vh]"><span class="loading loading-spinner loading-lg text-primary"></span></div>`;

  return `${buildHead(title, theme)}
  ${streamConnect}
  <div id="app" class="w-full"${signalsAttr}>
    ${loadingHtml}
  </div>
  ${buildFoot()}`;
}

export class PageTemplate {
  private options: PageTemplateOptions;
  
  constructor(options: PageTemplateOptions = {}) {
    this.options = options;
  }
  
  render(
    content: string,
    contextId?: string | null,
    initialSignals?: Record<string, unknown>,
  ): string {
    return generatePageHTML({
      ...this.options,
      content,
      contextId,
      initialSignals,
    });
  }

  shell(
    contextId?: string | null,
    initialSignals?: Record<string, unknown>,
  ): string {
    return generateShellHTML({
      ...this.options,
      contextId,
      initialSignals,
    });
  }
  
  setTitle(title: string): void {
    this.options.title = title;
  }
  
  setTheme(theme: PageTemplateOptions['theme']): void {
    this.options.theme = theme;
  }
}
