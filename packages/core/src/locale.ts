import { getCurrentSession } from './context';
import {
  CLAY_CATALOGS,
  DEFAULT_LOCALE,
  formatDate as formatDateFor,
  formatNumber as formatNumberFor,
  formatRelativeTime as formatRelativeTimeFor,
  matchLocale,
  mergeCatalogs,
  normalizeLocale,
  translate,
  type ClayMessageKey,
  type ClayMessages,
  type PluralBase,
  type MessageCatalogs,
  type MessageDict,
  type MessageParams,
} from './i18n';

/**
 * App-level message overrides / extra locales for `ui.run({ messages })`.
 * Keys are Clay message keys (`dataTable.export`, …); see `docs/i18n.md`.
 */
export type ClayMessageOverrides = Record<string, Partial<ClayMessages> & MessageDict>;

/** i18n settings accepted by `ui.run`. */
export type I18nConfig = {
  /**
   * Default UI locale (BCP 47, e.g. `'pt-PT'`). `'auto'` picks the best match for the
   * browser's languages among available catalogs, falling back to English. Default `'en'`.
   */
  locale?: string;
  /** Override or extend built-in messages per locale. Missing keys fall back to English. */
  messages?: ClayMessageOverrides;
};

/** What the server embeds in the SPA HTML so the first client render is already localised. */
export type ClientI18nBoot = {
  /** Default locale, or `'auto'` to follow the browser. */
  locale: string;
  /** Locales with a catalog (built-in + app overrides). */
  locales: string[];
  /** App overrides for Clay keys only (`{ 'pt-PT': { 'dataTable.export': '…' } }`). */
  messages: MessageCatalogs;
};

let defaultLocale = DEFAULT_LOCALE;
let autoLocale = false;
let overrides: MessageCatalogs = {};
let catalogs: MessageCatalogs = CLAY_CATALOGS;

/** Configure the process-wide default locale and message overrides (`ui.run` calls this). */
export function configureI18n(config: I18nConfig | null | undefined): void {
  overrides = mergeCatalogs({}, (config?.messages ?? {}) as MessageCatalogs);
  catalogs = mergeCatalogs(CLAY_CATALOGS, overrides);
  const requested = config?.locale;
  autoLocale = requested === 'auto';
  if (!requested || autoLocale) {
    defaultLocale = DEFAULT_LOCALE;
  } else {
    const norm = normalizeLocale(requested);
    if (!norm) throw new Error(`Invalid locale: ${requested}`);
    defaultLocale = norm;
  }
}

/** Locales with a catalog: built-in (`en`, `pt-PT`) plus any added via `ui.run({ messages })`. */
export function availableLocales(): string[] {
  return Object.keys(catalogs);
}

/** The app default locale (`ui.run({ locale })`), ignoring per-session choices. */
export function getDefaultLocale(): string {
  return defaultLocale;
}

/** Boot payload for the SPA HTML (`window.__CLAY_I18N__`). */
export function clientI18nBoot(): ClientI18nBoot {
  const clayKeys = new Set(Object.keys(CLAY_CATALOGS.en!));
  const messages: MessageCatalogs = {};
  for (const [l, dict] of Object.entries(overrides)) {
    const filtered: MessageDict = {};
    for (const [k, v] of Object.entries(dict)) if (clayKeys.has(k)) filtered[k] = v;
    if (Object.keys(filtered).length) messages[l] = filtered;
  }
  return { locale: autoLocale ? 'auto' : defaultLocale, locales: availableLocales(), messages };
}

/**
 * Locale for a newly connected session: the client's stored choice (an earlier `ui.setLocale`,
 * honoured even without a catalog — text falls back to English, formatting still follows it),
 * else the browser's best match under `locale: 'auto'`, else the app default.
 */
export function resolveHelloLocale(stored: unknown, languages: unknown): string {
  const available = availableLocales();
  const storedNorm = normalizeLocale(stored);
  if (storedNorm) {
    return available.find((l) => l.toLowerCase() === storedNorm.toLowerCase()) ?? storedNorm;
  }
  if (autoLocale) {
    const langs = Array.isArray(languages) ? languages.filter((l) => typeof l === 'string') : [];
    return matchLocale(langs, available) ?? DEFAULT_LOCALE;
  }
  return defaultLocale;
}

/** Current session locale (`ui.setLocale` / hello), else the app default. */
export function getLocale(): string {
  const session = getCurrentSession();
  return session?.locale ?? defaultLocale;
}

/** Options for {@link setLocale}. */
export type SetLocaleOptions = {
  /**
   * Rebuild the current page after switching so server-built strings (`ui.t`, `ui.messages`)
   * pick up the new locale. Clay's built-in client strings switch live either way. Default `true`.
   */
  remount?: boolean;
};

/**
 * Switch the UI language for the current session (`ui.setLocale('pt-PT')`). The browser
 * remembers the choice across reloads. `null` clears it and returns to the app default.
 */
export function setLocale(locale: string | null, options: SetLocaleOptions = {}): void {
  const session = getCurrentSession();
  if (!session) return;
  let next: string | null = null;
  if (locale != null) {
    next = normalizeLocale(locale);
    if (!next) throw new Error(`Invalid locale: ${locale}`);
  }
  // `null` re-resolves like a fresh connect without a stored choice (honours `locale: 'auto'`).
  const effective = next ?? resolveHelloLocale(null, session.clientLanguages);
  // Called from the app shell (e.g. a language menu in `headerActions`) or from a page: keep the
  // socket's shell and page sessions in step.
  for (const s of [session, session.shellSession, session.pageSession]) {
    if (s) s.locale = effective;
  }
  session.setLocale(next, options.remount ?? true);
}

/**
 * Translate a built-in Clay message key for the current session's locale
 * (honours `ui.run({ messages })` overrides; falls back to English).
 */
export function t(key: PluralBase<ClayMessageKey> | (string & {}), params?: MessageParams): string {
  return translate(catalogs, getLocale(), key, params);
}

/** A typed translator returned by {@link defineMessages}. */
export type Translator<K extends string> = {
  (key: K, params?: MessageParams): string;
  /** Same lookup for an explicit locale (e.g. emails, exports). */
  in(locale: string, key: K, params?: MessageParams): string;
  /** Locales this dictionary has. */
  readonly locales: string[];
};

/**
 * Define app messages with the same locale + fallback rules as Clay's own strings.
 * English (`en`) is required and defines the key set; other locales may be partial.
 *
 * ```ts
 * const t = ui.messages({
 *   en: { greeting: 'Hello, {name}', items_one: '{count} item', items_other: '{count} items' },
 *   'pt-PT': { greeting: 'Olá, {name}', items_one: '{count} item', items_other: '{count} itens' },
 * });
 * ui.label(t('greeting', { name: user.name }));
 * ```
 */
export function defineMessages<D extends MessageDict>(
  dict: { en: D } & Record<string, Partial<Record<keyof D & string, string>>>,
): Translator<PluralBase<keyof D & string>> {
  const local = mergeCatalogs({}, dict as MessageCatalogs);
  const fn = ((key: string, params?: MessageParams) => translate(local, getLocale(), key, params)) as Translator<
    PluralBase<keyof D & string>
  >;
  fn.in = (locale, key, params) => translate(local, normalizeLocale(locale) ?? DEFAULT_LOCALE, key, params);
  Object.defineProperty(fn, 'locales', { value: Object.keys(local) });
  return fn;
}


/** Format a number with the session locale (`ui.formatNumber(1234.5)` → `1234,5` in pt-PT). */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return formatNumberFor(getLocale(), value, options);
}

/** Format a date with the session locale. Default `{ dateStyle: 'medium' }`. */
export function formatDate(value: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  return formatDateFor(getLocale(), value, options);
}

/** Relative time with the session locale (`há 5 minutos`). */
export function formatRelativeTime(value: Date | string | number, now?: Date | number): string {
  return formatRelativeTimeFor(getLocale(), value, now);
}

export type { PluralBase };

/** Server-side i18n API, also exposed as `ui.i18n`. */
export const i18n = {
  getLocale,
  setLocale,
  getDefaultLocale,
  availableLocales,
  t,
  messages: defineMessages,
  formatNumber,
  formatDate,
  formatRelativeTime,
};
