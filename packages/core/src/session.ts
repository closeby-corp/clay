import { generateId } from './utils';
import {
  clearParentStack,
  runWithSession,
  setCurrentSession,
  withParent,
} from './context';
import { Element } from './element';
import type { ClientMessage, Patch, ServerMessage } from './protocol';
import { getPage } from './page';

export type SendFn = (msg: ServerMessage) => void;

export class ClientSession {
  readonly id: string;
  readonly path: string;
  root: Element | null = null;
  isMounted = false;

  private elements = new Map<string, Element>();
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

  getElement(id: string): Element | undefined {
    return this.elements.get(id);
  }

  enqueuePatch(patch: Patch): void {
    this.patches.push(patch);
    this.scheduleFlush();
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
    const page = getPage(this.path);
    if (!page) {
      this.send({ op: 'error', message: `No page registered for ${this.path}` });
      return;
    }

    clearParentStack();
    runWithSession(this, () => {
      const root = new Element('root', {});
      // Detach from any accidental parent
      root.parent = null;
      this.root = root;
      withParent(root, () => page());
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

  notify(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.send({ op: 'notify', message, type });
  }

  navigate(path: string): void {
    this.send({ op: 'navigate', path });
  }

  destroy(): void {
    this.root?.destroy();
    this.elements.clear();
    this.isMounted = false;
  }
}
