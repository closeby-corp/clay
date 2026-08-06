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
export class AutoElement extends RefreshableElement {
  private depUnsubs: Array<() => void> = [];

  constructor(builder: () => void) {
    // Closures used during `super()` (which runs the builder immediately).
    const depUnsubs: Array<() => void> = [];
    let refreshQueued = false;
    let doRefresh: () => void = () => {};

    super(() => {
      for (const unsub of depUnsubs) unsub();
      depUnsubs.length = 0;
      const deps = trackReads(builder);
      for (const { target, key } of deps) {
        depUnsubs.push(
          subscribe(target, key, () => {
            if (refreshQueued) return;
            refreshQueued = true;
            queueMicrotask(() => {
              refreshQueued = false;
              doRefresh();
            });
          }),
        );
      }
    });

    this.depUnsubs = depUnsubs;
    doRefresh = () => {
      this.refresh();
    };
  }

  override destroy(): void {
    for (const unsub of this.depUnsubs) unsub();
    this.depUnsubs = [];
    super.destroy();
  }
}

/** Create an auto-refreshing UI block (see {@link AutoElement}). */
export function auto(builder: () => void): AutoElement {
  return new AutoElement(builder);
}
