import { generateId } from './utils';
import {
  clearParentStack,
  runWithSession,
  setCurrentSession,
  withParent,
} from './context';
import { Element } from './element';
import type {
  ClientMessage,
  NotifyType,
  Patch,
  ServerMessage,
  ToastPosition,
} from './protocol';
import { getPageEntry, getPageWrapper } from './page';
import type { TimerHandle } from './timer';

export type SendFn = (msg: ServerMessage) => void;

/** Options for `ui.notify` when not using a bare type string. */
export type NotifyOptions = {
  /** Toast variant. Default `'info'`. */
  type?: NotifyType;
  /** Auto-dismiss duration in ms. */
  duration?: number;
  /** Screen corner for the toast. */
  position?: ToastPosition;
  /** Secondary line under the message. */
  description?: string;
};

/** Idle / absolute WS session expiry (from `ui.run` session*Ms options). */
export type SessionTimeoutConfig = {
  /** Sign out after this much idle time (ms) since last event. */
  idleMs?: number;
  /** Sign out after this much time (ms) since session create / hello. */
  absoluteMs?: number;
};

export class ClientSession {
  readonly id: string;
  readonly path: string;
  /** Stable browser user id from hello (localStorage); used by `storage.user`. */
  userId: string | null = null;
  /** Wall-clock time when this WS session was created (hello). */
  readonly createdAt: number;
  /** Last successful client event (or hello). */
  lastActivityAt: number;
  /** Optional idle / absolute timeouts (from `ui.run`). */
  timeouts: SessionTimeoutConfig | null = null;
  /**
   * Per-browser-tab key/value store. Survives `refreshable` rebuilds and is
   * rehydrated from `hello.tabStorage` (client sessionStorage bag) on reconnect
   * / navigate-hello. In-memory map is cleared when the session is destroyed.
   */
  readonly tab = new Map<string, unknown>();
  /**
   * Mirror of browser `localStorage` bag (`storage.browser`), hydrated on hello.
   */
  readonly browser = new Map<string, unknown>();
  /**
   * Mirror of tab `sessionStorage` bag (`storage.client`), hydrated on hello.
   */
  readonly client = new Map<string, unknown>();
  /**
   * Last known `location.hash` without leading `#` (from hello / `setUrlHash`).
   * Prefer `getUrlHash` / `setUrlHash` over reading `window` in page code.
   */
  urlHash = '';
  root: Element | null = null;
  isMounted = false;

  private elements = new Map<string, Element>();
  private timers = new Set<TimerHandle>();
  private patches: Patch[] = [];
  private send: SendFn;
  private flushScheduled = false;

  constructor(path: string, send: SendFn) {
    this.id = generateId('session');
    this.path = path;
    this.send = send;
    this.createdAt = Date.now();
    this.lastActivityAt = this.createdAt;
  }

  touch(): void {
    this.lastActivityAt = Date.now();
  }

  /** True when idle or absolute timeout has elapsed. */
  isExpired(now = Date.now()): boolean {
    const t = this.timeouts;
    if (!t) return false;
    if (t.absoluteMs != null && now - this.createdAt >= t.absoluteMs) return true;
    if (t.idleMs != null && now - this.lastActivityAt >= t.idleMs) return true;
    return false;
  }

  register(el: Element): void {
    this.elements.set(el.id, el);
  }

  unregister(id: string): void {
    this.elements.delete(id);
  }

  registerTimer(timer: TimerHandle): void {
    this.timers.add(timer);
  }

  unregisterTimer(timer: TimerHandle): void {
    this.timers.delete(timer);
  }

  getElement(id: string): Element | undefined {
    return this.elements.get(id);
  }

  enqueuePatch(patch: Patch): void {
    this.patches.push(patch);
    this.scheduleFlush();
  }

  /** Sync root children to the client after dynamic attach/detach. */
  syncRootChildren(): void {
    if (!this.root) return;
    this.enqueuePatch({
      op: 'setChildren',
      id: this.root.id,
      children: this.root.children.map((c) => c.toJSON()),
    });
  }

  private scheduleFlush(): void {
    if (this.flushScheduled || !this.isMounted) return;
    this.flushScheduled = true;
    queueMicrotask(() => this.flushPatches());
  }

  flushPatches(): void {
    this.flushScheduled = false;
    if (this.patches.length === 0) return;
    const patches = this.patches;
    this.patches = [];
    this.send({ op: 'patch', patches });
  }

  mount(): void {
    const entry = getPageEntry(this.path);
    if (!entry) {
      this.send({ op: 'error', message: `No page registered for ${this.path}` });
      return;
    }

    clearParentStack();
    runWithSession(this, () => {
      const root = new Element('root', {});
      // Detach from any accidental parent
      root.parent = null;
      this.root = root;
      withParent(root, () => {
        const wrapper = getPageWrapper();
        if (wrapper && entry.options.shell !== false) {
          wrapper(entry.fn);
        } else {
          entry.fn();
        }
      });
    });

    this.isMounted = true;
    this.send({
      op: 'mount',
      sessionId: this.id,
      tree: this.root!.toJSON(),
    });
  }

  async handleMessage(msg: ClientMessage): Promise<void> {
    if (msg.op === 'hello') {
      // remount if path changes
      return;
    }
    if (msg.op === 'event') {
      const el = this.elements.get(msg.id);
      if (!el) return;
      setCurrentSession(this);
      try {
        await runWithSession(this, async () => {
          await el.handleEvent(msg.type, msg.value);
        });
      } finally {
        this.flushPatches();
      }
    }
  }

  notify(
    message: string,
    typeOrOptions: NotifyType | NotifyOptions = 'info',
  ): void {
    const options: NotifyOptions =
      typeof typeOrOptions === 'string' ? { type: typeOrOptions } : typeOrOptions;
    this.send({
      op: 'notify',
      id: generateId('toast'),
      message,
      type: options.type ?? 'info',
      duration: options.duration ?? 2500,
      position: options.position ?? 'bottom-right',
      description: options.description,
    });
  }

  dismissNotify(id: string): void {
    this.send({ op: 'dismissNotify', id });
  }

  download(filename: string, mime: string, content: string): void {
    this.send({ op: 'download', filename, mime, content });
  }

  clipboard(content: string): void {
    this.send({ op: 'clipboard', content });
  }

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.send({ op: 'theme', theme });
  }

  /** Sync client `location.hash` (pass without `#`; empty clears). */
  setUrlHash(hash: string): void {
    const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
    this.urlHash = normalized;
    this.send({ op: 'setUrlHash', hash: normalized });
  }

  /** Open `url` in a new tab on the client (`noopener`). */
  openExternal(url: string): void {
    this.send({ op: 'openExternal', url });
  }

  runJavaScript(code: string): void {
    this.send({ op: 'runJavaScript', code });
  }

  scrollTo(options: {
    top?: number | 'top' | 'bottom';
    left?: number;
    behavior?: 'auto' | 'smooth';
  } = {}): void {
    this.send({
      op: 'scroll',
      target: 'window',
      top: options.top,
      left: options.left,
      behavior: options.behavior,
    });
  }

  scrollIntoView(
    selector: string,
    options: {
      behavior?: 'auto' | 'smooth';
      block?: 'start' | 'center' | 'end' | 'nearest';
      inline?: 'start' | 'center' | 'end' | 'nearest';
    } = {},
  ): void {
    this.send({
      op: 'scroll',
      target: 'selector',
      selector,
      behavior: options.behavior,
      block: options.block,
      inline: options.inline,
    });
  }

  clientStorage(
    scope: 'browser' | 'client' | 'tab',
    action: 'set' | 'delete' | 'clear',
    key?: string,
    value?: unknown,
  ): void {
    this.send({ op: 'clientStorage', scope, action, key, value });
  }

  navigate(path: string): void {
    this.send({ op: 'navigate', path });
  }

  /** Ask the client to close and reopen the WebSocket (cookie refresh). */
  reconnect(): void {
    this.send({ op: 'reconnect' });
  }

  /**
   * Ask the client to establish/clear the auth cookie over HTTP, then soft-reconnect.
   */
  authSession(
    action: 'establish' | 'clear',
    options?: { token?: string; path?: string },
  ): void {
    this.send({
      op: 'authSession',
      action,
      token: options?.token,
      path: options?.path,
    });
  }

  destroy(): void {
    for (const t of [...this.timers]) t.cancel();
    this.timers.clear();
    this.root?.destroy();
    this.elements.clear();
    this.tab.clear();
    this.browser.clear();
    this.client.clear();
    this.userId = null;
    this.isMounted = false;
  }
}
