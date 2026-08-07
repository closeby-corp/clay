import { getCurrentSession, runWithSession } from './context';
import type { ClientSession } from './session';

export type TimerOptions = {
  /** Fire once after `interval` seconds (setTimeout), then cancel. Default false. */
  once?: boolean;
};

/**
 * Session-scoped timer (NiceGUI-ish).
 * Interval is in **seconds**. Cleared automatically on `ClientSession.destroy`.
 */
export class TimerHandle {
  private session: ClientSession | null;
  private callback: () => void | Promise<void>;
  private intervalSec: number;
  private once: boolean;
  private _active = false;
  private _cancelled = false;
  private timerId: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> | null = null;
  private running = false;

  constructor(
    session: ClientSession | null,
    intervalSec: number,
    callback: () => void | Promise<void>,
    options: TimerOptions = {},
  ) {
    this.session = session;
    this.intervalSec = intervalSec;
    this.callback = callback;
    this.once = options.once ?? false;
    session?.registerTimer(this);
    this.activate();
  }

  get active(): boolean {
    return this._active && !this._cancelled;
  }

  get cancelled(): boolean {
    return this._cancelled;
  }

  activate(): void {
    if (this._cancelled || this._active) return;
    this._active = true;
    this.schedule();
  }

  deactivate(): void {
    if (this._cancelled) return;
    this._active = false;
    this.clearNative();
  }

  /** Permanently stop; cannot be activated again. */
  cancel(): void {
    if (this._cancelled) return;
    this._cancelled = true;
    this._active = false;
    this.clearNative();
    this.session?.unregisterTimer(this);
  }

  private ms(): number {
    return Math.max(0, this.intervalSec * 1000);
  }

  private clearNative(): void {
    if (this.timerId == null) return;
    if (this.once) clearTimeout(this.timerId);
    else clearInterval(this.timerId);
    this.timerId = null;
  }

  private schedule(): void {
    this.clearNative();
    if (!this._active || this._cancelled) return;
    const ms = this.ms();
    if (this.once) {
      this.timerId = setTimeout(() => {
        void this.tick();
      }, ms);
    } else {
      this.timerId = setInterval(() => {
        void this.tick();
      }, ms);
    }
  }

  private async tick(): Promise<void> {
    if (!this._active || this._cancelled || this.running) return;
    this.running = true;
    const session = this.session;
    try {
      if (session) {
        await runWithSession(session, async () => {
          await this.callback();
        });
        session.flushPatches();
      } else {
        await this.callback();
      }
    } finally {
      this.running = false;
    }
    if (this.once) this.cancel();
  }
}

/**
 * Start a session-scoped timer. `interval` is in **seconds**.
 * Prefer `ui.timer`. Cleared on session destroy.
 */
export function timer(
  interval: number,
  callback: () => void | Promise<void>,
  options?: TimerOptions,
): TimerHandle {
  return new TimerHandle(getCurrentSession(), interval, callback, options);
}
