import { generateId } from './utils';
import { getCurrentParent, getCurrentSession, withParent } from './context';
import { subscribe, trackReads } from './reactive';
import type { ElementNode } from './protocol';
import type { ClientSession } from './session';

export type EventHandler = (value?: unknown) => void | Promise<void>;

export class Element {
  readonly id: string;
  readonly type: string;
  props: Record<string, unknown>;
  children: Element[] = [];
  parent: Element | null = null;

  protected handlers = new Map<string, EventHandler>();
  protected boundSession: ClientSession | null = null;
  protected classList: string[] = [];
  protected styleText = '';
  protected unsubs: Array<() => void> = [];

  constructor(type: string, props: Record<string, unknown> = {}, id?: string) {
    this.id = id ?? generateId(type);
    this.type = type;
    this.props = { ...props };
    this.extractHandlers(props);
    this.attachToContext();
  }

  protected extractHandlers(props: Record<string, unknown>): void {
    const events: string[] = [];
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'function' && key.startsWith('on') && key.length > 2) {
        const eventName = key.slice(2, 3).toLowerCase() + key.slice(3);
        this.handlers.set(eventName, value as EventHandler);
        events.push(eventName);
        delete this.props[key];
      }
    }
    if (events.length > 0) {
      this.props.events = [...new Set([...(this.props.events as string[] ?? []), ...events])];
    }
  }

  protected attachToContext(): void {
    const session = getCurrentSession();
    if (session) {
      this.boundSession = session;
      session.register(this);
    }
    const parent = getCurrentParent();
    if (parent) {
      parent.add(this);
    }
  }

  get session(): ClientSession | null {
    return this.boundSession ?? getCurrentSession();
  }

  setSession(session: ClientSession): void {
    this.boundSession = session;
    session.register(this);
    for (const child of this.children) {
      child.setSession(session);
    }
  }

  add(child: Element): this {
    child.parent = this;
    this.children.push(child);
    if (this.boundSession) child.setSession(this.boundSession);
    return this;
  }

  clearChildren(): void {
    for (const child of this.children) {
      child.destroy();
    }
    this.children = [];
  }

  destroy(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    for (const child of this.children) child.destroy();
    this.children = [];
    this.session?.unregister(this.id);
  }

  classes(...classNames: string[]): this {
    for (const c of classNames) {
      if (!c) continue;
      for (const part of c.split(/\s+/)) {
        if (part && !this.classList.includes(part)) this.classList.push(part);
      }
    }
    this.props.className = this.classList.join(' ');
    this.queuePropsPatch({ className: this.props.className });
    return this;
  }

  style(styles: Record<string, string> | string): this {
    if (typeof styles === 'string') {
      this.styleText = styles;
    } else {
      this.styleText = Object.entries(styles)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${v}`)
        .join('; ');
    }
    this.props.style = this.styleText;
    this.queuePropsPatch({ style: this.styleText });
    return this;
  }

  on(event: string, handler: EventHandler): this {
    const prev = this.handlers.get(event);
    this.handlers.set(
      event,
      prev
        ? async (value) => {
            await prev(value);
            await handler(value);
          }
        : handler,
    );
    const events = new Set([...(this.props.events as string[] ?? []), event]);
    this.props.events = [...events];
    this.queuePropsPatch({ events: this.props.events });
    return this;
  }

  setText(text: string): this {
    this.props.text = text;
    this.queuePropsPatch({ text });
    return this;
  }

  setValue(value: unknown): this {
    this.props.value = value;
    this.queuePropsPatch({ value });
    return this;
  }

  /** Set or clear field-level validation error (`props.error`). Empty/null clears. */
  setError(message: string | null | undefined): this {
    if (message == null || message === '') {
      delete this.props.error;
      this.queuePropsPatch({ error: null });
    } else {
      this.props.error = message;
      this.queuePropsPatch({ error: message });
    }
    return this;
  }

  getValue(): unknown {
    return this.props.value;
  }

  get(): unknown {
    return this.getValue();
  }

  set(value: unknown): this {
    return this.setValue(value);
  }

  update(props?: Record<string, unknown>): this {
    if (props) {
      const serializable: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (typeof v === 'function' && k.startsWith('on')) {
          this.extractHandlers({ [k]: v });
        } else {
          this.props[k] = v;
          if (typeof v !== 'function') serializable[k] = v;
        }
      }
      if (this.props.events) serializable.events = this.props.events;
      this.queuePropsPatch(serializable);
    } else {
      this.session?.enqueuePatch({ op: 'replace', id: this.id, node: this.toJSON() });
    }
    return this;
  }

  /** Two-way bind an input-like element's value to `obj[key]`. */
  bindValue(obj: object, key: string): this {
    const current = (obj as Record<string, unknown>)[key];
    if (current !== undefined) {
      this.props.value = current;
    }
    this.on('input', (value) => {
      (obj as Record<string, unknown>)[key] = value;
      this.props.value = value;
    });
    this.on('change', (value) => {
      (obj as Record<string, unknown>)[key] = value;
      this.props.value = value;
    });
    const unsub = subscribe(obj, key, () => {
      const next = (obj as Record<string, unknown>)[key];
      if (this.props.value !== next) {
        this.props.value = next;
        this.queuePropsPatch({ value: next });
      }
    });
    this.unsubs.push(unsub);
    return this;
  }

  /** One-way bind text from `obj[key]`. */
  bindTextFrom(obj: object, key: string): this {
    const sync = () => {
      const next = String((obj as Record<string, unknown>)[key] ?? '');
      if (this.props.text !== next) {
        this.props.text = next;
        this.queuePropsPatch({ text: next });
      }
    };
    sync();
    this.unsubs.push(subscribe(obj, key, sync));
    return this;
  }

  /**
   * One-way bind text from a compute function. Re-runs when any `state` /
   * `reactive` property read during compute changes (same tracking as `auto`).
   */
  bindText(compute: () => string): this {
    const depUnsubs: Array<() => void> = [];
    let queued = false;
    const sync = () => {
      for (const unsub of depUnsubs) unsub();
      depUnsubs.length = 0;
      let next = '';
      const deps = trackReads(() => {
        next = String(compute());
      });
      if (this.props.text !== next) {
        this.props.text = next;
        this.queuePropsPatch({ text: next });
      }
      for (const { target, key } of deps) {
        depUnsubs.push(
          subscribe(target, key, () => {
            if (queued) return;
            queued = true;
            queueMicrotask(() => {
              queued = false;
              sync();
            });
          }),
        );
      }
    };
    sync();
    this.unsubs.push(() => {
      for (const unsub of depUnsubs) unsub();
      depUnsubs.length = 0;
    });
    return this;
  }

  /**
   * Copy handlers + serializable props from a freshly built twin, keeping this
   * element's id. Used by in-place `refresh` to prefer `updateProps` over remount.
   */
  protected absorbRebuild(source: Element): void {
    this.handlers = new Map(source.handlers);
    this.classList = [...source.classList];
    this.styleText = source.styleText;

    const patch: Record<string, unknown> = {};
    const nextProps = { ...source.props };
    for (const key of Object.keys(this.props)) {
      if (!(key in nextProps)) {
        delete this.props[key];
        patch[key] = null;
      }
    }
    for (const [key, value] of Object.entries(nextProps)) {
      if (this.props[key] !== value) {
        this.props[key] = value;
        if (typeof value !== 'function') patch[key] = value;
      }
    }
    if (Object.keys(patch).length > 0) {
      this.queuePropsPatch(patch);
    }

    const oldKids = this.children;
    const newKids = source.children;
    for (let i = 0; i < oldKids.length; i++) {
      oldKids[i]!.absorbRebuild(newKids[i]!);
    }
  }

  async handleEvent(type: string, value?: unknown): Promise<void> {
    if (value !== undefined && (type === 'input' || type === 'change')) {
      this.props.value = value;
    }
    const handler = this.handlers.get(type);
    if (handler) await handler(value);
  }

  toJSON(): ElementNode {
    return {
      id: this.id,
      type: this.type,
      props: { ...this.props },
      children: this.children.map((c) => c.toJSON()),
    };
  }

  protected queuePropsPatch(props: Record<string, unknown>): void {
    const session = this.session;
    if (!session || !session.isMounted) return;
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(props)) {
      if (typeof v !== 'function') clean[k] = v;
    }
    session.enqueuePatch({ op: 'updateProps', id: this.id, props: clean });
  }
}

export class RefreshableElement extends Element {
  private builder: () => void;

  constructor(builder: () => void) {
    super('refreshable', {});
    this.builder = builder;
    withParent(this, () => this.builder());
  }

  refresh(): void {
    const previous = this.children;
    for (const child of previous) {
      child.parent = null;
    }
    this.children = [];
    withParent(this, () => this.builder());
    const next = this.children;

    if (previous.length > 0 && canReuseElementTree(previous, next)) {
      for (let i = 0; i < previous.length; i++) {
        previous[i]!.absorbRebuild(next[i]!);
      }
      for (const child of next) {
        child.parent = null;
        child.destroy();
      }
      this.children = previous;
      for (const child of previous) {
        child.parent = this;
      }
      return;
    }

    for (const child of previous) {
      child.destroy();
    }
    const session = this.session;
    if (session?.isMounted) {
      session.enqueuePatch({
        op: 'setChildren',
        id: this.id,
        children: this.children.map((c) => c.toJSON()),
      });
    }
  }
}

/** Same type shape and no nested refreshable/auto roots → safe for in-place props sync. */
function canReuseElementTree(previous: Element[], next: Element[]): boolean {
  if (previous.length !== next.length) return false;
  for (let i = 0; i < previous.length; i++) {
    const a = previous[i]!;
    const b = next[i]!;
    if (a.type !== b.type) return false;
    if (a instanceof RefreshableElement || b instanceof RefreshableElement) return false;
    if (!canReuseElementTree(a.children, b.children)) return false;
  }
  return true;
}
