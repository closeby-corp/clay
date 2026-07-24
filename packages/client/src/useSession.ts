import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, ElementNode, Patch, ServerMessage } from './protocol';

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

export type SessionState = {
  tree: ElementNode | null;
  connected: boolean;
  error: string | null;
  toast: { message: string; type: string } | null;
};

export function useBadUISession(path: string) {
  const [state, setState] = useState<SessionState>({
    tree: null,
    connected: false,
    error: null,
    toast: null,
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
        setState((s) => ({ ...s, toast: { message: msg.message, type: msg.type } }));
        setTimeout(() => setState((s) => ({ ...s, toast: null })), 2500);
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
