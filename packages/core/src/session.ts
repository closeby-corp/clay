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

export type NotifyOptions = {
  type?: NotifyType;
  duration?: number;
  position?: ToastPosition;
  description?: string;
};

export class ClientSession {
  readonly id: string;
  readonly path: string;
  /** Stable browser user id from hello (localStorage); used by `storage.user`. */
  userId: string | null = null;
  /**
   * Per-tab (WS session) key/value store. Survives `refreshable` rebuilds;
   * cleared when the session is destroyed.
   */
  readonly tab = new Map<string, unknown>();
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

  navigate(path: string): void {
    this.send({ op: 'navigate', path });
  }

  destroy(): void {
    for (const t of [...this.timers]) t.cancel();
    this.timers.clear();
    this.root?.destroy();
    this.elements.clear();
    this.tab.clear();
    this.userId = null;
    this.isMounted = false;
  }
}
