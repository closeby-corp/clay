import { getCurrentSession, runWithSession, type ClientSession } from '@close-by/clay-core';

const callbacks = new WeakMap<ClientSession, Array<() => void>>();

/** Register cleanup for disconnect or page replacement. Requires an active session. */
export function onDispose(callback: () => void): void {
  const session = getCurrentSession();
  if (!session) throw new Error('onDispose requires an active session');
  const pending = callbacks.get(session) ?? [];
  pending.push(callback);
  callbacks.set(session, pending);
}

/** Dispose page resources at the same boundary as session timers. */
export function disposeSession(session: ClientSession): void {
  const pending = callbacks.get(session) ?? [];
  callbacks.delete(session);
  for (const callback of pending) {
    try {
      runWithSession(session, callback);
    } catch (error) {
      console.error('[clay] onDispose callback failed', error);
    }
  }
  session.destroy();
}
