import type { Element } from './element';

export type FieldRule = {
  /** Bound input (or any element with `setError`). */
  el: Element;
  /** Return error string or null/undefined if ok. */
  check: () => string | null | undefined;
};

/** Runs checks, calls `setError` on each field, returns true if all pass. Prefer `ui.validate`. */
export function validate(rules: FieldRule[]): boolean {
  let ok = true;
  for (const rule of rules) {
    const message = rule.check();
    if (message) {
      rule.el.setError(message);
      ok = false;
    } else {
      rule.el.setError(null);
    }
  }
  return ok;
}
