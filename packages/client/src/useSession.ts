import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { applyPatch } from './applyPatch';
import {
  applyClientStorageOp,
  applyScrollOp,
  loadBrowserStorageBag,
  loadClientStorageBag,
  runClientJavaScript,
} from './clientBridge';
import {
  createReconnectController,
  WS_RECONNECT_TOAST_ID,
} from './reconnect';
import { applyServerTheme, isThemeMode } from './themeBridge';
import type {
  ClientMessage,
  ElementNode,
  NotifyType,
  ServerMessage,
  ToastPosition,
} from './protocol';

function showToast(
  message: string,
  opts: {
    id?: string;
    type?: NotifyType;
    duration?: number;
    position?: ToastPosition;
    description?: string;
  },
): void {
  const duration = opts.duration === 0 ? Infinity : (opts.duration ?? 2500);
  const options = {
    id: opts.id,
    duration,
    position: opts.position ?? 'bottom-right',
    description: opts.description,
  };
  switch (opts.type) {
    case 'success':
      toast.success(message, options);
      break;
    case 'warning':
      toast.warning(message, options);
      break;
    case 'error':
      toast.error(message, options);
      break;
    case 'info':
    default:
      toast.info(message, options);
      break;
  }
}

export type SessionState = {
  tree: ElementNode | null;
  connected: boolean;
  error: string | null;
};

const USER_ID_KEY = 'badui-user-id';

function getOrCreateUserId(): string {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, id);
    }
    // Mirror to cookie for a NiceGUI-ish durable id (same value as localStorage).
    document.cookie = `${USER_ID_KEY}=${encodeURIComponent(id)};path=/;max-age=31536000;SameSite=Lax`;
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function useBadUISession(path: string) {
  const [state, setState] = useState<SessionState>({
    tree: null,
    connected: false,
    error: null,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const pathRef = useRef(path);
  const userIdRef = useRef(getOrCreateUserId());
  /** Skip path-driven hello on the first effect run; `onopen` sends the initial hello. */
  const pathHelloReady = useRef(false);
  const everOpened = useRef(false);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const emit = useCallback(
    (id: string, type: string, value?: unknown) => {
      send({ op: 'event', id, type, value });
    },
    [send],
  );

  // Durable socket with auto-reconnect: SPA path changes send `hello` on the same
  // connection so the client can keep `app` chrome mounted (see stickyShell).
  useEffect(() => {
    const controller = createReconnectController();
    const userId = userIdRef.current;

    const handleMessage = (ev: MessageEvent) => {
      const msg = JSON.parse(String(ev.data)) as ServerMessage;
      if (msg.op === 'mount') {
        setState((s) => ({ ...s, tree: msg.tree, error: null }));
      } else if (msg.op === 'patch') {
        setState((s) => {
          if (!s.tree) return s;
          let tree = s.tree;
          for (const patch of msg.patches) {
            tree = applyPatch(tree, patch);
          }
          return { ...s, tree };
        });
      } else if (msg.op === 'navigate') {
        // Align with nav `go()`: pushState + popstate → App path → hello below.
        window.history.pushState({}, '', msg.path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else if (msg.op === 'notify') {
        showToast(msg.message, {
          id: msg.id,
          type: msg.type ?? 'info',
          duration: msg.duration,
          position: msg.position,
          description: msg.description,
        });
      } else if (msg.op === 'dismissNotify') {
        toast.dismiss(msg.id);
      } else if (msg.op === 'theme') {
        if (isThemeMode(msg.theme)) applyServerTheme(msg.theme);
      } else if (msg.op === 'runJavaScript') {
        try {
          runClientJavaScript(msg.code);
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'JavaScript failed', {
            type: 'error',
          });
        }
      } else if (msg.op === 'scroll') {
        applyScrollOp(msg);
      } else if (msg.op === 'clientStorage') {
        applyClientStorageOp(msg);
      } else if (msg.op === 'download') {
        const blob = new Blob([msg.content], { type: msg.mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = msg.filename;
        a.click();
        URL.revokeObjectURL(url);
      } else if (msg.op === 'clipboard') {
        const write = async () => {
          try {
            await navigator.clipboard.writeText(msg.content);
          } catch {
            showToast('Clipboard copy failed', { type: 'error' });
          }
        };
        void write();
      } else if (msg.op === 'error') {
        setState((s) => ({ ...s, error: msg.message }));
      }
    };

    const connect = () => {
      if (controller.isDisposed()) return;

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        const wasReconnect = everOpened.current;
        everOpened.current = true;
        controller.resetAttempt();
        setState((s) => ({ ...s, connected: true, error: null }));
        if (wasReconnect) {
          toast.dismiss(WS_RECONNECT_TOAST_ID);
          toast.success('Reconnected');
        }
        ws.send(
          JSON.stringify({
            op: 'hello',
            path: pathRef.current,
            userId,
            browserStorage: loadBrowserStorageBag(),
            clientStorage: loadClientStorageBag(),
          } satisfies ClientMessage),
        );
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
        setState((s) => ({ ...s, connected: false }));
        if (controller.isDisposed()) return;
        showToast('Disconnected — reconnecting…', {
          id: WS_RECONNECT_TOAST_ID,
          type: 'warning',
          duration: 0,
        });
        controller.scheduleReconnect(connect);
      };

      ws.onerror = () => {
        setState((s) => ({ ...s, error: 'WebSocket error', connected: false }));
      };
    };

    connect();

    return () => {
      controller.dispose();
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.onopen = null;
        ws.close();
      }
      toast.dismiss(WS_RECONNECT_TOAST_ID);
    };
  }, []);

  useEffect(() => {
    pathRef.current = path;
    if (!pathHelloReady.current) {
      pathHelloReady.current = true;
      return;
    }
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          op: 'hello',
          path,
          userId: userIdRef.current,
          browserStorage: loadBrowserStorageBag(),
          clientStorage: loadClientStorageBag(),
        } satisfies ClientMessage),
      );
    }
  }, [path]);

  return { ...state, emit };
}
