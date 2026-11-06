import { generateId } from './utils';
import { getCurrentParent, getCurrentSession, withParent } from './context';
import { subscribe, trackReads } from './reactive';
import type { ElementNode } from './protocol';
import type { ClientSession } from './session';
import { hasRole } from './roles';

export type EventHandler = (value?: unknown) => void | Promise<void>;

export class Element {
  readonly id: string;
  readonly type: string;
  props: Record<string, unknown>;
  children: Element[] = [];
  parent: Element | null = null;
  /** Explicit identity for keyed reconciliation (never sent to the client). */
  reconcileKey?: string;

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

  /**
   * Move `child` under this element (for JSX children-first evaluation).
   * Detaches from any previous parent without destroying the child.
   */
  adopt(child: Element): this {
    if (child.parent) {
      const prev = child.parent;
      const idx = prev.children.indexOf(child);
      if (idx >= 0) prev.children.splice(idx, 1);
      child.parent = null;
    }
    return this.add(child);
  }

  /**
   * Keep this element only for users with at least one of `roles`
   * (see `ui.run({ getRoles })`). Otherwise it is removed and destroyed before
   * it reaches the client, handlers included. Call while building.
   */
  roles(roles: string | readonly string[]): this {
    if (hasRole(roles)) return this;
    const parent = this.parent;
    if (parent) {
      const idx = parent.children.indexOf(this);
      if (idx >= 0) parent.children.splice(idx, 1);
      this.parent = null;
      const session = parent.session;
      if (session?.isMounted) {
        session.enqueuePatch({ op: 'setChildren', id: parent.id, children: parent.children.map((c) => c.toJSON()) });
      }
    }
    this.destroy();
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

  /**
   * Explicit identity used when a `refreshable` / `auto` re-runs. Use inside
   * refreshable/auto lists so items keep identity when the list is reordered,
   * filtered or prepended. Not sent to the client.
   */
  key(k: string | number): this {
    this.reconcileKey = String(k);
    return this;
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
  /** @internal */
  absorbRebuild(source: Element): void {
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
        if (value === undefined) delete this.props[key];
        else this.props[key] = value;
        if (typeof value !== 'function') patch[key] = value === undefined ? null : value;
      }
    }
    if (Object.keys(patch).length > 0) {
      this.queuePropsPatch(patch);
    }

    this.reconcileKey = source.reconcileKey;
    const oldKids = this.children;
    const newKids = source.children;
    source.children = [];
    reconcileChildren(this, oldKids, newKids);
  }

  /**
   * @internal Become `old` on the client: take its id, send only the props that
   * changed, reconcile children against its children, then destroy `old`.
   * The fresh instance survives, so handlers it bound to itself (DataTable search,
   * sort, paging, map drags, ...) and references user code saved during the rebuild
   * keep pointing at the live element.
   */
  takeOver(old: Element): void {
    const session = this.boundSession ?? old.session;
    session?.unregister(this.id);

    const patch: Record<string, unknown> = {};
    for (const key of Object.keys(old.props)) {
      if (!(key in this.props)) patch[key] = null;
    }
    for (const [key, value] of Object.entries(this.props)) {
      if (old.props[key] !== value && typeof value !== 'function') {
        patch[key] = value === undefined ? null : value;
      }
    }

    (this as { id: string }).id = old.id;
    this.parent = old.parent;

    const oldKids = old.children;
    const newKids = this.children;
    old.children = [];
    for (const kid of oldKids) kid.parent = this;
    // Leaves `old` registered under the shared id until we re-register below.
    old.parent = null;
    old.destroy();
    if (session) {
      this.boundSession = session;
      session.register(this);
    }
    if (Object.keys(patch).length > 0) this.queuePropsPatch(patch);
    reconcileChildren(this, oldKids, newKids);
  }

  /** @internal Dispose of a freshly built twin whose state was absorbed into an older element. */
  discardTwin(): void {
    this.parent = null;
    this.destroy();
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
      if (typeof v !== 'function') clean[k] = v === undefined ? null : v;
    }
    session.enqueuePatch({ op: 'updateProps', id: this.id, props: clean });
  }
}

export class RefreshableElement extends Element {
  protected builder: () => void;
  /**
   * Set on a discarded twin: the surviving instance that took over its builder.
   * Handles captured from the twin (e.g. `const inner = ui.auto(...)` inside an outer
   * builder) forward `refresh()` and `children` to the survivor. Holds no subscriptions.
   */
  private adoptedBy: RefreshableElement | null = null;

  constructor(builder: () => void) {
    super('refreshable', {});
    this.builder = builder;
    withParent(this, () => this.builder());
  }

  refresh(): void {
    if (this.adoptedBy) {
      this.adoptedBy.refresh();
      return;
    }
    const previous = this.children;
    for (const child of previous) child.parent = null;
    this.children = [];
    withParent(this, () => this.builder());
    const next = this.children;
    this.children = previous;
    for (const child of previous) child.parent = this;
    reconcileChildren(this, previous, next);
  }

  /**
   * Take over `source`'s builder (which closes over fresh data). Subclasses that attach
   * extra machinery to the builder (e.g. reactive tracking) override this to move it too.
   */
  protected adoptBuilder(source: RefreshableElement): void {
    this.builder = source.builder;
  }

  /** Keep this instance (id, children) but adopt the fresh builder. */
  override absorbRebuild(source: Element): void {
    super.absorbRebuild(source);
    if (source instanceof RefreshableElement) {
      this.adoptBuilder(source);
      source.adoptedBy = this;
    }
  }

  override discardTwin(): void {
    const survivor = this.adoptedBy;
    this.adoptedBy = null;
    super.discardTwin();
    if (survivor) {
      this.adoptedBy = survivor;
      Object.defineProperty(this, 'children', {
        configurable: true,
        get: () => survivor.children,
        set: (v: Element[]) => {
          survivor.children = v;
        },
      });
    }
  }

  override destroy(): void {
    if (this.adoptedBy) return; // twin: the survivor owns everything
    super.destroy();
  }
}

function sameKind(a: Element, b: Element): boolean {
  return a.type === b.type && a.constructor === b.constructor;
}

/**
 * Match `next` children onto `old` ones (keyed by `key()`, otherwise positionally
 * with a one-element lookahead), absorb matched pairs, destroy leftovers, and emit a
 * single `setChildren` for `parent` only when the id list changed.
 */
function reconcileChildren(parent: Element, old: Element[], next: Element[]): void {
  const oldIds = old.map((c) => c.id);
  const matched = new Map<Element, Element>(); // new -> old
  const used = new Set<Element>();

  const keyedOld = new Map<string, Element[]>();
  const oldU: Element[] = [];
  for (const o of old) {
    if (o.reconcileKey === undefined) oldU.push(o);
    else {
      const list = keyedOld.get(o.reconcileKey) ?? [];
      list.push(o);
      keyedOld.set(o.reconcileKey, list);
    }
  }
  const newU: Element[] = [];
  for (const n of next) {
    if (n.reconcileKey === undefined) {
      newU.push(n);
      continue;
    }
    const list = keyedOld.get(n.reconcileKey);
    const idx = list ? list.findIndex((o) => !used.has(o) && sameKind(o, n)) : -1;
    if (idx >= 0) {
      const o = list![idx]!;
      used.add(o);
      matched.set(n, o);
    }
  }

  let i = 0;
  let j = 0;
  while (i < oldU.length && j < newU.length) {
    const o = oldU[i]!;
    const n = newU[j]!;
    if (sameKind(o, n)) {
      used.add(o);
      matched.set(n, o);
      i++;
      j++;
    } else if (i + 1 < oldU.length && sameKind(oldU[i + 1]!, n)) {
      i++; // old[i] was removed
    } else if (j + 1 < newU.length && sameKind(o, newU[j + 1]!)) {
      j++; // new[j] was inserted
    } else {
      i++;
      j++; // replaced
    }
  }

  const result: Element[] = [];
  for (const n of next) {
    const o = matched.get(n);
    if (o instanceof RefreshableElement) {
      // Refreshables keep their instance (builder, reactive subscriptions) and adopt the new builder.
      o.absorbRebuild(n);
      n.discardTwin();
      o.parent = parent;
      result.push(o);
    } else if (o) {
      n.takeOver(o);
      n.parent = parent;
      result.push(n);
    } else {
      n.parent = parent;
      result.push(n);
    }
  }
  for (const o of old) {
    if (!used.has(o)) {
      o.parent = null;
      o.destroy();
    }
  }
  parent.children = result;

  const session = parent.session;
  if (session?.isMounted && (oldIds.length !== result.length || result.some((c, k) => c.id !== oldIds[k]))) {
    session.enqueuePatch({
      op: 'setChildren',
      id: parent.id,
      children: result.map((c) => c.toJSON()),
    });
  }
}
