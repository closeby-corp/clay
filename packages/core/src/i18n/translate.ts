/**
 * Pure, dependency-free message lookup shared by the server (`ui.t`, `ui.messages`) and the
 * browser client. No session / DOM access here so the client bundle can import it directly.
 */

/** A flat dictionary of dotted message keys → message strings for one locale. */
export type MessageDict = Record<string, string>;

/** Dictionaries keyed by BCP 47 locale tag (`en`, `pt-PT`, …). */
export type MessageCatalogs = Record<string, MessageDict>;

/** Values substituted into `{name}` placeholders. `count` also selects plural forms. */
export type MessageParams = Record<string, string | number | null | undefined>;

/** Keys usable with `t()`: plural variants `x_one` / `x_other` are also addressed as `x`. */
export type PluralBase<K extends string> =
  | K
  | (K extends `${infer B}_${'zero' | 'one' | 'two' | 'few' | 'many' | 'other'}` ? B : never);

/** The base locale every lookup falls back to. */
export const DEFAULT_LOCALE = 'en';

/**
 * Canonicalise a locale tag (`pt_pt` → `pt-PT`, `EN-us` → `en-US`).
 * Returns `null` for empty / malformed input.
 */
export function normalizeLocale(tag: unknown): string | null {
  if (typeof tag !== 'string') return null;
  const raw = tag.trim().replace(/_/g, '-');
  if (!raw || !/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(raw)) return null;
  try {
    return Intl.getCanonicalLocales(raw)[0] ?? null;
  } catch {
    return null;
  }
}

/** Language subtag of a locale (`pt-PT` → `pt`). */
export function baseLanguage(locale: string): string {
  return locale.split('-')[0]!.toLowerCase();
}

/**
 * Pick the best supported locale for a list of preferences (e.g. `navigator.languages`).
 * Preferences are tried in order; each matches exactly, else by language (`pt-BR` → `pt-PT`,
 * `en-GB` → `en`), so `['pt-BR', 'en']` picks `pt-PT`. Returns `null` when nothing matches.
 */
export function matchLocale(
  preferred: readonly (string | null | undefined)[] | string | null | undefined,
  supported: readonly string[],
): string | null {
  const prefs = (Array.isArray(preferred) ? preferred : [preferred])
    .map(normalizeLocale)
    .filter((p): p is string => p != null);
  const norm = supported.map((s) => normalizeLocale(s) ?? s);
  for (const p of prefs) {
    let i = norm.findIndex((s) => s.toLowerCase() === p.toLowerCase());
    if (i < 0) i = norm.findIndex((s) => baseLanguage(s) === baseLanguage(p));
    if (i >= 0) return supported[i]!;
  }
  return null;
}

/**
 * Lookup order for `locale`: the locale itself, its bare language (`pt-PT` → `pt`),
 * any other catalog of the same language, then English.
 */
export function fallbackChain(locale: string, available: readonly string[]): string[] {
  const chain: string[] = [];
  const add = (l: string) => {
    if (!chain.includes(l)) chain.push(l);
  };
  const norm = normalizeLocale(locale) ?? DEFAULT_LOCALE;
  add(norm);
  const lang = baseLanguage(norm);
  add(lang);
  for (const a of available) if (baseLanguage(a) === lang) add(a);
  add(DEFAULT_LOCALE);
  return chain;
}

const pluralRulesCache = new Map<string, Intl.PluralRules>();
function pluralCategory(locale: string, count: number): string {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    try {
      rules = new Intl.PluralRules(locale);
    } catch {
      rules = new Intl.PluralRules(DEFAULT_LOCALE);
    }
    pluralRulesCache.set(locale, rules);
  }
  return rules.select(count);
}

/** Replace `{name}` placeholders. Unknown placeholders are left as-is. */
export function interpolate(message: string, params?: MessageParams, locale = DEFAULT_LOCALE): string {
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (match, name: string) => {
    const v = params[name];
    if (v == null) return match;
    if (typeof v === 'number') {
      try {
        return new Intl.NumberFormat(locale).format(v);
      } catch {
        return String(v);
      }
    }
    return String(v);
  });
}

/**
 * Translate `key` for `locale` using `catalogs`.
 *
 * - Plurals: when `params.count` is a number, `key_<category>` (`_one`, `_other`, …, from
 *   `Intl.PluralRules`) is preferred over `key`.
 * - Missing keys fall back through {@link fallbackChain} to English; if English lacks the key
 *   too, `fallback` (or, as a last resort, the key itself) is returned.
 */
export function translate(
  catalogs: MessageCatalogs,
  locale: string,
  key: string,
  params?: MessageParams,
  fallback?: string,
): string {
  const chain = fallbackChain(locale, Object.keys(catalogs));
  const count = params?.count;
  for (const l of chain) {
    const dict = catalogs[l];
    if (!dict) continue;
    if (typeof count === 'number') {
      const plural = dict[`${key}_${pluralCategory(l, count)}`] ?? dict[`${key}_other`];
      if (plural != null) return interpolate(plural, params, locale);
    }
    const msg = dict[key];
    if (msg != null) return interpolate(msg, params, locale);
  }
  return interpolate(fallback ?? key, params, locale);
}

/** Merge override catalogs onto base catalogs (per-key, per-locale). Inputs are not mutated. */
export function mergeCatalogs(base: MessageCatalogs, ...overrides: (MessageCatalogs | null | undefined)[]): MessageCatalogs {
  const out: MessageCatalogs = {};
  for (const [l, dict] of Object.entries(base)) out[l] = { ...dict };
  for (const o of overrides) {
    if (!o) continue;
    for (const [rawLocale, dict] of Object.entries(o)) {
      if (!dict || typeof dict !== 'object') continue;
      const l = normalizeLocale(rawLocale) ?? rawLocale;
      out[l] = { ...(out[l] ?? {}) };
      for (const [k, v] of Object.entries(dict)) {
        if (typeof v === 'string') out[l]![k] = v;
      }
    }
  }
  return out;
}
