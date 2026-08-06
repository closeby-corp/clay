import type { Element } from './element';

export type FieldRule = {
  el: Element;
  /** Return error string or null/undefined if ok. */
  check: () => string | null | undefined;
};

/** Runs checks, calls `setError` on each field, returns true if all pass. */
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
