export type NotifyType = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type ElementNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children: ElementNode[];
};

export type Patch =
  | { op: 'replace'; id: string; node: ElementNode }
  | { op: 'updateProps'; id: string; props: Record<string, unknown> }
  | { op: 'setChildren'; id: string; children: ElementNode[] }
  | { op: 'remove'; id: string };

export type ServerMessage =
  | { op: 'mount'; sessionId: string; tree: ElementNode }
  | { op: 'patch'; patches: Patch[] }
  | { op: 'navigate'; path: string }
  | {
      op: 'notify';
      id: string;
      message: string;
      type?: NotifyType;
      duration?: number;
      position?: ToastPosition;
      description?: string;
    }
  | { op: 'dismissNotify'; id: string }
  | { op: 'download'; filename: string; mime: string; content: string }
  | { op: 'clipboard'; content: string }
  | { op: 'theme'; theme: 'light' | 'dark' | 'system' }
  | { op: 'runJavaScript'; code: string }
  /** Set `location.hash` on the client (no leading `#` in `hash`; empty clears). */
  | { op: 'setUrlHash'; hash: string }
  /** `window.open(url, '_blank', 'noopener,noreferrer')` on the client. */
  | { op: 'openExternal'; url: string }
  | {
      op: 'scroll';
      target: 'window' | 'selector';
      top?: number | 'top' | 'bottom';
      left?: number;
      behavior?: 'auto' | 'smooth';
      selector?: string;
      block?: 'start' | 'center' | 'end' | 'nearest';
      inline?: 'start' | 'center' | 'end' | 'nearest';
    }
  | {
      op: 'clientStorage';
      scope: 'browser' | 'client' | 'tab';
      action: 'set' | 'delete' | 'clear';
      key?: string;
      value?: unknown;
    }
  /** Soft-reconnect: client closes WS and reconnects (picks up new cookies). */
  | { op: 'reconnect' }
  /**
   * Establish or clear the HttpOnly auth cookie via HTTP, then soft-reconnect.
   * `establish` requires a server-signed `token`; client POSTs it to `/auth/session`.
   */
  | {
      op: 'authSession';
      action: 'establish' | 'clear';
      token?: string;
      /** Optional SPA path after cookie update (before reconnect). */
      path?: string;
    }
  | { op: 'error'; message: string };

export type ClientMessage =
  | {
      op: 'hello';
      path: string;
      userId?: string;
      /** Current `location.hash` without leading `#` (empty if none). */
      hash?: string;
      /** localStorage bag mirror for `storage.browser`. */
      browserStorage?: Record<string, unknown>;
      /** sessionStorage bag mirror for `storage.client`. */
      clientStorage?: Record<string, unknown>;
      /** sessionStorage bag mirror for `storage.tab` (survives reconnect / navigate-hello). */
      tabStorage?: Record<string, unknown>;
    }
  | { op: 'event'; id: string; type: string; value?: unknown };
