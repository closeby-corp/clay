import { DATATABLE_CLIENT_SCRIPT } from './datatable-client';

export interface PageTemplateOptions {
  title?: string;
  theme?: 'light' | 'dark' | 'cupcake' | 'bumblebee' | 'emerald' | 'corporate' | 'synthwave' | 'retro' | 'cyberpunk' | 'valentine' | 'halloween' | 'garden' | 'forest' | 'aqua' | 'lofi' | 'pastel' | 'fantasy' | 'wireframe' | 'black' | 'luxury' | 'dracula' | 'cmyk' | 'autumn' | 'business' | 'acid' | 'lemonade' | 'night' | 'coffee' | 'winter' | 'dim' | 'nord' | 'sunset';
  content?: string;
  contextId?: string | null;
}

export function generatePageHTML(options: PageTemplateOptions = {}): string {
  const {
    title = 'BadUI App',
    theme = 'light',
    content = '',
    contextId = null
  } = options;
  
  const contextIdAttr = contextId ? ` data-signals='{"ctxId":"${contextId}"}'` : '';

  return `<!DOCTYPE html>
<html data-theme="${theme}" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  
  <!-- DaisyUI 5 + Tailwind CSS 4 (CDN) -->
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5/themes.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  
  <!-- Datastar -->
  <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@v1.0.2/bundles/datastar.js"></script>
  
  <style>
    input:focus, textarea:focus, select:focus {
      outline: 2px solid oklch(var(--p));
      outline-offset: 2px;
    }
  </style>
</head>
<body ${contextIdAttr} class="min-h-screen bg-base-100">
  <div id="app" class="w-full">
    ${content}
  </div>
  
  <script>
    // Toast notifications
    function showToast(message, type, duration, position) {
      type = type || 'info';
      duration = duration || 3000;
      position = position || 'bottom-right';
      
      const posClasses = {
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'top-right': 'top-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4'
      };
      
      const posClass = posClasses[position] || posClasses['bottom-right'];
      const toast = document.createElement('div');
      toast.className = 'alert alert-' + type + ' fixed ' + posClass + ' z-50 shadow-lg max-w-sm';
      toast.innerHTML = '<span>' + message + '</span>';
      document.body.appendChild(toast);
      
      setTimeout(function() { toast.remove(); }, duration);
    }
    
    // File upload helper
    window.handleFileSelect = function(input, componentId) {
      const files = Array.from(input.files).map(function(f) {
        return { name: f.name, size: f.size, type: f.type };
      });
      const ctxSignals = document.body.getAttribute('data-signals');
      const ctxId = ctxSignals ? JSON.parse(ctxSignals).ctxId : null;
      
      fetch('/badui/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compId: componentId,
          evtType: 'change',
          ctxId: ctxId,
          files: files
        })
      }).then(function(r) { return r.text(); }).then(function(html) {
        if (html && html.trim().startsWith('<')) {
          const app = document.getElementById('app');
          if (app) app.outerHTML = html;
        }
      });
    };
    
    // Loading overlay
    function showLoadingOverlay(text) {
      const existing = document.getElementById('badui-loading-overlay');
      if (existing) existing.remove();
      
      const overlay = document.createElement('div');
      overlay.id = 'badui-loading-overlay';
      overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]';
      overlay.innerHTML = '<div class="bg-base-100 rounded-lg p-6 flex flex-col items-center gap-3 shadow-xl">' +
        '<span class="loading loading-spinner loading-lg text-primary"></span>' +
        '<span class="text-base-content">' + text + '</span>' +
        '</div>';
      document.body.appendChild(overlay);
    }
    
    function hideLoadingOverlay() {
      const overlay = document.getElementById('badui-loading-overlay');
      if (overlay) overlay.remove();
    }
    
    ${DATATABLE_CLIENT_SCRIPT}
  </script>
</body>
</html>`;
}

export class PageTemplate {
  private options: PageTemplateOptions;
  
  constructor(options: PageTemplateOptions = {}) {
    this.options = options;
  }
  
  render(content: string, contextId?: string | null): string {
    return generatePageHTML({
      ...this.options,
      content,
      contextId
    });
  }
  
  setTitle(title: string): void {
    this.options.title = title;
  }
  
  setTheme(theme: PageTemplateOptions['theme']): void {
    this.options.theme = theme;
  }
}
