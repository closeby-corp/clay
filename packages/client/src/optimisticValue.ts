/**
 * Pure helper mirroring Bound* optimistic sync:
 * if the server value changed, prefer it; otherwise keep the local edit.
 */
export function nextOptimisticValue<T>(serverValue: T, prevServer: T, local: T): T {
  if (prevServer !== serverValue) return serverValue;
  return local;
}
