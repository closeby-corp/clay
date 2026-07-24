import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ClientMessage,
  ElementNode,
  Patch,
  ServerMessage,
  ToastItem,
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

let clientToastSeq = 0;
function nextClientToastId(): string {
  clientToastSeq += 1;
  return `toast_client_${clientToastSeq}`;
}

export type SessionState = {
  tree: ElementNode | null;
  connected: boolean;
  error: string | null;
  toasts: ToastItem[];
  toastPosition: ToastPosition;
};

export function useBadUISession(path: string) {
  const [state, setState] = useState<SessionState>({
    tree: null,
    connected: false,
    error: null,
    toasts: [],
    toastPosition: 'bottom-right',
  });
  const wsRef = useRef<WebSocket | null>(null);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setState((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) }));
  }, []);

  const pushToast = useCallback(
    (item: ToastItem) => {
      setState((s) => ({
        ...s,
        toasts: [...s.toasts, item],
        toastPosition: item.position,
      }));
      if (item.duration > 0) {
        const timer = setTimeout(() => dismissToast(item.id), item.duration);
        timersRef.current.set(item.id, timer);
      }
    },
    [dismissToast],
  );

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

    ws.onopen = () => {
      setState((s) => ({ ...s, connected: true, error: null }));
      ws.send(JSON.stringify({ op: 'hello', path } satisfies ClientMessage));
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
        ws.send(JSON.stringify({ op: 'hello', path: msg.path } satisfies ClientMessage));
      } else if (msg.op === 'notify') {
        pushToast({
          id: msg.id ?? nextClientToastId(),
          message: msg.message,
          type: msg.type ?? 'info',
          duration: msg.duration ?? 2500,
          position: msg.position ?? 'bottom-right',
        });
      } else if (msg.op === 'dismissNotify') {
        dismissToast(msg.id);
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
            pushToast({
              id: nextClientToastId(),
              message: 'Clipboard copy failed',
              type: 'error',
              duration: 2500,
              position: 'bottom-right',
            });
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
      for (const timer of timersRef.current.values()) clearTimeout(timer);
      timersRef.current.clear();
      ws.close();
      wsRef.current = null;
    };
  }, [path, pushToast, dismissToast]);

  return { ...state, emit, dismissToast };
}
