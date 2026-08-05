import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type {
  ClientMessage,
  ElementNode,
  NotifyType,
  Patch,
  ServerMessage,
  ToastPosition,
} from './protocol';

function applyPatch(tree: ElementNode, patch: Patch): ElementNode {
  if (patch.op === 'replace') {
    if (tree.id === patch.id) return patch.node;
    return {
      ...tree,
      children: tree.children.map((c) => applyPatch(c, patch)),
    };
  }

  if (patch.op === 'remove') {
    return {
      ...tree,
      children: tree.children
        .filter((c) => c.id !== patch.id)
        .map((c) => applyPatch(c, patch)),
    };
  }

  if (patch.op === 'updateProps') {
    if (tree.id === patch.id) {
      return { ...tree, props: { ...tree.props, ...patch.props } };
    }
    return {
      ...tree,
      children: tree.children.map((c) => applyPatch(c, patch)),
    };
  }

  if (patch.op === 'setChildren') {
    if (tree.id === patch.id) {
      return { ...tree, children: patch.children };
    }
    return {
      ...tree,
      children: tree.children.map((c) => applyPatch(c, patch)),
    };
  }

  return tree;
}

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

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
    wsRef.current = ws;
    const userId = getOrCreateUserId();

    ws.onopen = () => {
      setState((s) => ({ ...s, connected: true, error: null }));
      ws.send(JSON.stringify({ op: 'hello', path, userId } satisfies ClientMessage));
    };

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as ServerMessage;
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
        window.history.pushState({}, '', msg.path);
        ws.send(
          JSON.stringify({ op: 'hello', path: msg.path, userId } satisfies ClientMessage),
        );
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

    ws.onclose = () => setState((s) => ({ ...s, connected: false }));
    ws.onerror = () => setState((s) => ({ ...s, error: 'WebSocket error', connected: false }));

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [path]);

  return { ...state, emit };
}
