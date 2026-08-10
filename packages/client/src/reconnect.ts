/** Sticky Sonner id for the disconnect / reconnect toast. */
export const WS_RECONNECT_TOAST_ID = 'clay-ws';

export const WS_RECONNECT_BASE_MS = 500;
export const WS_RECONNECT_MAX_MS = 10_000;

/**
 * Delay before showing a disconnect toast. Short drops (e.g. `--reload`) only
 * use the Clay status chip; longer outages escalate to a sticky toast.
 */
export const WS_OUTAGE_TOAST_AFTER_MS = 4_000;

/** Exponential backoff: 500ms → 1s → 2s → … capped at 10s. */
export function reconnectDelayMs(attempt: number): number {
  return Math.min(WS_RECONNECT_BASE_MS * 2 ** Math.max(0, attempt), WS_RECONNECT_MAX_MS);
}

export type ReconnectController = {
  dispose: () => void;
  isDisposed: () => boolean;
  resetAttempt: () => void;
  /** Schedule reconnect if not disposed. Returns delay used, or null if skipped. */
  scheduleReconnect: (connect: () => void) => number | null;
};

export function createReconnectController(opts?: {
  schedule?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clear?: (id: ReturnType<typeof setTimeout>) => void;
}): ReconnectController {
  const schedule = opts?.schedule ?? ((fn, ms) => setTimeout(fn, ms));
  const clear = opts?.clear ?? ((id) => clearTimeout(id));
  let disposed = false;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    dispose() {
      disposed = true;
      if (timer != null) {
        clear(timer);
        timer = null;
      }
    },
    isDisposed() {
      return disposed;
    },
    resetAttempt() {
      attempt = 0;
    },
    scheduleReconnect(connect: () => void): number | null {
      if (disposed) return null;
      if (timer != null) {
        clear(timer);
        timer = null;
      }
      const delay = reconnectDelayMs(attempt);
      attempt += 1;
      timer = schedule(() => {
        timer = null;
        if (!disposed) connect();
      }, delay);
      return delay;
    },
  };
}
