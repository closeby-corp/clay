import { RefreshableElement } from './element';
import { subscribe, trackReads } from './reactive';

/**
 * Block-scoped reactive rebuild: re-runs `builder` when any `reactive` /
 * `state` property read during the previous run changes.
 *
 * Keep mutable state **outside** the builder (or it resets on each refresh):
 *
 * ```ts
 * const s = state({ count: 0 });
 * auto(() => {
 *   label(`Count: ${s.count}`);
 *   button('+', { onClick: () => { s.count++; } });
 * });
 * ```
 */
interface AutoCtx {
  unsubs: Array<() => void>;
  queued: boolean;
  /** Instance that stays mounted; dependency changes refresh it. */
  owner: AutoElement | null;
}

export class AutoElement extends RefreshableElement {
  private ctx: AutoCtx;

  constructor(builder: () => void) {
    // Closure used during `super()` (which runs the builder immediately).
    const ctx: AutoCtx = { unsubs: [], queued: false, owner: null };

    super(() => {
      for (const unsub of ctx.unsubs) unsub();
      ctx.unsubs.length = 0;
      const deps = trackReads(builder);
      for (const { target, key } of deps) {
        ctx.unsubs.push(
          subscribe(target, key, () => {
            if (ctx.queued) return;
            ctx.queued = true;
            queueMicrotask(() => {
              ctx.queued = false;
              ctx.owner?.refresh();
            });
          }),
        );
      }
    });

    this.ctx = ctx;
    ctx.owner = this;
  }

  /**
   * Adopt the twin's builder wrapper together with its dependency tracking: its
   * subscriptions now refresh this (surviving) instance, and the twin keeps none.
   */
  protected override adoptBuilder(source: RefreshableElement): void {
    const twin = source as AutoElement;
    for (const unsub of this.ctx.unsubs) unsub();
    this.ctx.owner = null;
    super.adoptBuilder(source);
    this.ctx = twin.ctx;
    this.ctx.owner = this;
    twin.ctx = { unsubs: [], queued: false, owner: null };
  }

  override destroy(): void {
    if (this.ctx.owner === this) {
      for (const unsub of this.ctx.unsubs) unsub();
      this.ctx.unsubs = [];
      this.ctx.owner = null;
    }
    super.destroy();
  }
}

/** Create an auto-refreshing UI block (see {@link AutoElement}). */
export function auto(builder: () => void): AutoElement {
  return new AutoElement(builder);
}
