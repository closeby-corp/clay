export interface PageTemplateOptions {
  title?: string;
  theme?: 'light' | 'dark' | 'cupcake' | 'bumblebee' | 'emerald' | 'corporate' | 'synthwave' | 'retro' | 'cyberpunk' | 'valentine' | 'halloween' | 'garden' | 'forest' | 'aqua' | 'lofi' | 'pastel' | 'fantasy' | 'wireframe' | 'black' | 'luxury' | 'dracula' | 'cmyk' | 'autumn' | 'business' | 'acid' | 'lemonade' | 'night' | 'coffee' | 'winter' | 'dim' | 'nord' | 'sunset';
  content?: string;
  wsPort?: number;
}

export function generatePageHTML(options: PageTemplateOptions = {}): string {
  const {
    title = 'Ralph UI App',
    theme = 'light',
    content = '',
    wsPort = 3000
  } = options;

  return `<!DOCTYPE html>
<html data-theme="${theme}" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  
  <!-- TailwindCSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- DaisyUI -->
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.2/dist/full.min.css" rel="stylesheet" type="text/css" />
  
  <!-- HTMX -->
  <script src="https://unpkg.com/htmx.org@1.9.12/dist/htmx.min.js"></script>
  
  <!-- Hyperscript -->
  <script src="https://unpkg.com/hyperscript.org@0.9.12"></script>
  
  <style>
    /* Smooth transitions for HTMX swaps */
    .htmx-swapping {
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }
    
    .htmx-added {
      opacity: 0;
    }
    
    .htmx-settling {
      opacity: 1;
      transition: opacity 0.2s ease-in;
    }
  </style>
</head>
<body class="min-h-screen bg-base-100">
  <div id="app" class="w-full">
    ${content}
  </div>
  
  <script>
    // Ralph UI WebSocket Connection
    (function() {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = wsProtocol + '//' + window.location.host + '/ralph-ws';
      
      let ws = null;
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 5;
      const reconnectDelay = 1000;
      
      function connect() {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = function() {
          console.log('[Ralph] WebSocket connected');
          reconnectAttempts = 0;
          
          // Send registration message
          ws.send(JSON.stringify({
            type: 'register',
            url: window.location.pathname
          }));
        };
        
        ws.onmessage = function(event) {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (e) {
            console.error('[Ralph] Error parsing message:', e);
          }
        };
        
        ws.onclose = function() {
          console.log('[Ralph] WebSocket disconnected');
          attemptReconnect();
        };
        
        ws.onerror = function(error) {
          console.error('[Ralph] WebSocket error:', error);
        };
      }
      
      function attemptReconnect() {
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log('[Ralph] Reconnecting... attempt ' + reconnectAttempts);
          setTimeout(connect, reconnectDelay * reconnectAttempts);
        } else {
          console.error('[Ralph] Max reconnection attempts reached');
        }
      }
      
      function handleWebSocketMessage(data) {
        switch (data.type) {
          case 'welcome':
            console.log('[Ralph] Connected with ID:', data.id);
            break;
            
          case 'update':
            // Update component HTML
            if (data.componentId && data.html) {
              const element = document.getElementById(data.componentId);
              if (element) {
                element.outerHTML = data.html;
                // Re-initialize hyperscript on new elements
                if (window._hyperscript) {
                  window._hyperscript.processNode(document.body);
                }
              }
            }
            break;
            
          case 'oob':
            // Out-of-band updates
            if (data.updates && Array.isArray(data.updates)) {
              data.updates.forEach(update => {
                if (update.componentId && update.html) {
                  const element = document.getElementById(update.componentId);
                  if (element) {
                    element.outerHTML = update.html;
                  }
                }
              });
              // Re-initialize hyperscript
              if (window._hyperscript) {
                window._hyperscript.processNode(document.body);
              }
            }
            break;
            
          case 'navigate':
            // Navigate to new page
            if (data.path) {
              window.history.pushState(null, '', data.path);
              htmx.ajax('GET', data.path, { target: '#app' });
            }
            break;
            
          case 'toast':
            // Show toast notification
            showToast(data.message, data.toastType || 'info');
            break;
            
          case 'modal':
            // Show/hide modal
            if (data.action === 'show' && data.modalId) {
              const modal = document.getElementById(data.modalId);
              if (modal && modal.showModal) {
                modal.showModal();
              }
            } else if (data.action === 'close' && data.modalId) {
              const modal = document.getElementById(data.modalId);
              if (modal && modal.close) {
                modal.close();
              }
            }
            break;
            
          case 'pong':
            // Heartbeat response
            break;
            
          default:
            console.log('[Ralph] Unknown message type:', data.type);
        }
      }
      
      function showToast(message, type) {
        type = type || 'info';
        const toast = document.createElement('div');
        toast.className = 'alert alert-' + type + ' fixed bottom-4 right-4 z-50 shadow-lg max-w-sm';
        toast.innerHTML = '<span>' + message + '</span>';
        document.body.appendChild(toast);
        
        setTimeout(function() {
          toast.remove();
        }, 3000);
      }
      
      // Start connection
      connect();
      
      // Heartbeat to keep connection alive
      setInterval(function() {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
      
      // Expose WebSocket globally for components
      window.RalphWS = ws;
    })();
    
    // HTMX Configuration
    document.body.addEventListener('htmx:configRequest', function(evt) {
      // Add client ID to all HTMX requests
      // This could be stored in a cookie or localStorage
      const clientId = document.cookie.match(/ralph-client-id=([^;]+)/)?.[1];
      if (clientId) {
        evt.detail.headers['X-Ralph-Client-ID'] = clientId;
      }
    });
    
    // Re-initialize hyperscript after HTMX swaps
    document.body.addEventListener('htmx:afterSwap', function(evt) {
      if (window._hyperscript) {
        window._hyperscript.processNode(evt.detail.target);
      }
    });
  </script>
</body>
</html>`;
}

export class PageTemplate {
  private options: PageTemplateOptions;
  
  constructor(options: PageTemplateOptions = {}) {
    this.options = options;
  }
  
  render(content: string): string {
    return generatePageHTML({
      ...this.options,
      content
    });
  }
  
  setTitle(title: string): void {
    this.options.title = title;
  }
  
  setTheme(theme: PageTemplateOptions['theme']): void {
    this.options.theme = theme;
  }
}
