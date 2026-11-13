const clients = new Map<string, { sockets: number; timer?: ReturnType<typeof setTimeout> }>();
const listeners = new Set<(count: number) => void>();
let notification: ReturnType<typeof setTimeout> | undefined;

function notify(): void {
  if (notification) return;
  notification = setTimeout(() => {
    notification = undefined;
    const count = clients.size;
    for (const listener of listeners) {
      try { listener(count); } catch (error) { console.error('[clay] presence subscriber failed', error); }
    }
  }, 100);
}

/** Process-local connected browsers; disconnects have a five-second reconnect grace. */
export const presence = {
  count: (): number => clients.size,
  subscribe(fn: (count: number) => void): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};

/** Internal socket lifecycle, independent of page sessions and authenticated users. */
export function connectPresence(id: string): (immediate?: boolean) => void {
  let client = clients.get(id);
  if (!client) {
    client = { sockets: 0 };
    clients.set(id, client);
    notify();
  }
  clearTimeout(client.timer);
  client.timer = undefined;
  client.sockets++;
  let closed = false;
  return (immediate = false) => {
    if (!closed) { client.sockets--; closed = true; }
    if (client.sockets || clients.get(id) !== client) return;
    clearTimeout(client.timer);
    const remove = () => { clients.delete(id); notify(); };
    if (immediate) remove();
    else client.timer = setTimeout(remove, 5000);
  };
}
