import { getCurrentSession, storage } from '@badui/core';

export type AuditEntry = {
  id: string;
  at: number;
  actor: string | null;
  action: string;
  target?: string;
  details?: Record<string, unknown>;
};

export type AuditRecordOptions = {
  /** App storage key. Default `auditLog`. */
  storeKey?: string;
  /** Max entries retained. Default 200. */
  maxEntries?: number;
  /** Override actor (defaults to session.userId). */
  actor?: string | null;
  target?: string;
  details?: Record<string, unknown>;
};

let auditSeq = 0;

/**
 * Append an audit entry to `ui.storage.app` (swallow errors so actions never fail).
 * Wave 3 helper — available early so demos can wire once.
 */
export async function auditRecord(
  action: string,
  options: AuditRecordOptions = {},
): Promise<AuditEntry | null> {
  try {
    const storeKey = options.storeKey ?? 'auditLog';
    const maxEntries = options.maxEntries ?? 200;
    const store = storage.app.create<AuditEntry[]>(storeKey, [], { persist: false });
    const actor =
      options.actor !== undefined
        ? options.actor
        : (getCurrentSession()?.userId ?? null);
    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${++auditSeq}`,
      at: Date.now(),
      actor,
      action,
      target: options.target,
      details: options.details,
    };
    const prev = await store.get();
    const next = [entry, ...prev].slice(0, maxEntries);
    await store.set(next);
    return entry;
  } catch {
    return null;
  }
}

export async function listAuditRecords(
  options?: { storeKey?: string },
): Promise<AuditEntry[]> {
  const storeKey = options?.storeKey ?? 'auditLog';
  const store = storage.app.create<AuditEntry[]>(storeKey, [], { persist: false });
  return store.get();
}

export async function clearAuditRecords(
  options?: { storeKey?: string },
): Promise<void> {
  const storeKey = options?.storeKey ?? 'auditLog';
  const store = storage.app.create<AuditEntry[]>(storeKey, [], { persist: false });
  await store.set([]);
}
