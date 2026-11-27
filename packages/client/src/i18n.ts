/**
 * Client locale store. The server embeds `window.__CLAY_I18N__` (default locale, available
 * locales, app message overrides) in the SPA HTML; `ui.setLocale` switches it live via the
 * `locale` op. Components read strings with {@link useT} (re-renders on change) or, outside
 * React, {@link t}. Catalogs and Intl helpers are shared with the server from core/src/i18n.
 */
import { useMemo, useSyncExternalStore } from 'react';
import {
  CLAY_CATALOGS,
  CLAY_LOCALES,
  DEFAULT_LOCALE,
  formatDate as formatDateFor,
  formatNumber as formatNumberFor,
  formatRelativeTime as formatRelativeTimeFor,
  matchLocale,
  mergeCatalogs,
  monthNames,
  normalizeLocale,
  translate,
  weekdayNames,
  weekStartsOn as weekStartsOnFor,
  type ClayMessageKey,
  type ClayTranslationKey,
  type MessageCatalogs,
  type MessageParams,
} from '../../core/src/i18n';

export type { ClayMessageKey, ClayTranslationKey, MessageParams };

/** localStorage key holding the locale chosen via `ui.setLocale` (absent → app default). */
export const CLAY_LOCALE_KEY = 'clay-locale';

/** Shape of `window.__CLAY_I18N__` (see core `ClientI18nBoot`). */
export type I18nBoot = {
  locale: string;
  locales: string[];
  messages: MessageCatalogs;
};

function readBoot(): I18nBoot {
  const raw = (globalThis as { __CLAY_I18N__?: Partial<I18nBoot> }).__CLAY_I18N__;
  return {
    locale: typeof raw?.locale === 'string' ? raw.locale : DEFAULT_LOCALE,
    locales: Array.isArray(raw?.locales) && raw.locales.length ? raw.locales : [...CLAY_LOCALES],
    messages: raw?.messages && typeof raw.messages === 'object' ? raw.messages : {},
  };
}

function readStored(): string | null {
  try {
    return normalizeLocale(globalThis.localStorage?.getItem(CLAY_LOCALE_KEY));
  } catch {
    return null;
  }
}

function browserLanguages(): string[] {
  const nav = (globalThis as { navigator?: Navigator }).navigator;
  if (!nav) return [];
  if (Array.isArray(nav.languages) && nav.languages.length) return [...nav.languages];
  return nav.language ? [nav.language] : [];
}

let boot = readBoot();
let catalogs = mergeCatalogs(CLAY_CATALOGS, boot.messages);
let locale = resolveLocale(readStored());
const listeners = new Set<() => void>();

/** Same rules as the server's `resolveHelloLocale`. */
function resolveLocale(stored: string | null): string {
  if (stored) return boot.locales.find((l) => l.toLowerCase() === stored.toLowerCase()) ?? stored;
  if (boot.locale === 'auto') return matchLocale(browserLanguages(), boot.locales) ?? DEFAULT_LOCALE;
  return normalizeLocale(boot.locale) ?? DEFAULT_LOCALE;
}

function syncDocumentLang(): void {
  const doc = (globalThis as { document?: Document }).document;
  if (doc?.documentElement) doc.documentElement.lang = locale;
}
syncDocumentLang();

function emitChange(): void {
  syncDocumentLang();
  for (const l of listeners) l();
}

/** Current UI locale (BCP 47). */
export function getLocale(): string {
  return locale;
}

/**
 * Apply a server `locale` op: persist the choice (or clear it for `null`) and re-render every
 * component that reads strings through {@link useT} / {@link useLocale}.
 */
export function applyLocale(next: string | null): void {
  const norm = next == null ? null : normalizeLocale(next);
  try {
    if (norm) globalThis.localStorage?.setItem(CLAY_LOCALE_KEY, norm);
    else globalThis.localStorage?.removeItem(CLAY_LOCALE_KEY);
  } catch {
    /* storage unavailable */
  }
  const resolved = norm ?? resolveLocale(null);
  if (resolved === locale) return;
  locale = resolved;
  emitChange();
}

/** Fields the client reports on hello so the server resolves the same locale. */
export function localeHello(): { locale?: string; languages: string[] } {
  const stored = readStored();
  return { ...(stored ? { locale: stored } : {}), languages: browserLanguages() };
}

/** Translate a Clay message key for the current locale (non-hook; does not subscribe). */
export function t(key: ClayTranslationKey, params?: MessageParams): string {
  return translate(catalogs, locale, key, params);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current locale; re-renders the caller when it changes. */
export function useLocale(): string {
  return useSyncExternalStore(subscribe, getLocale, getLocale);
}

/** Translator bound to the current locale; re-renders the caller on locale change. */
export type Translate = (key: ClayTranslationKey, params?: MessageParams) => string;

/** `const t = useT(); t('dataTable.export')`. */
export function useT(): Translate {
  const loc = useLocale();
  return useMemo<Translate>(() => (key, params) => translate(catalogs, loc, key, params), [loc]);
}

/** Locale-bound formatters for component code. */
export type LocaleFormat = {
  locale: string;
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
  date: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  relative: (value: Date | string | number, now?: Date | number) => string;
  /** First weekday (0 = Sunday, 1 = Monday) for calendars. */
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  monthNames: (style?: 'long' | 'short' | 'narrow') => string[];
  weekdayNames: (style?: 'long' | 'short' | 'narrow') => string[];
};

function makeFormat(loc: string): LocaleFormat {
  return {
    locale: loc,
    number: (value, options) => formatNumberFor(loc, value, options),
    date: (value, options) => formatDateFor(loc, value, options),
    relative: (value, now) => formatRelativeTimeFor(loc, value, now),
    weekStartsOn: weekStartsOnFor(loc),
    monthNames: (style) => monthNames(loc, style),
    weekdayNames: (style) => weekdayNames(loc, style),
  };
}

/** Formatters for the current locale (non-hook). */
export function format(): LocaleFormat {
  return makeFormat(locale);
}

/** Formatters for the current locale; re-renders the caller on locale change. */
export function useFormat(): LocaleFormat {
  const loc = useLocale();
  return useMemo(() => makeFormat(loc), [loc]);
}

/**
 * Test helper: reset the store as if the page booted with `nextBoot` (and optional stored
 * choice). Notifies subscribers.
 */
export function __setI18nBootForTests(nextBoot?: Partial<I18nBoot>, stored: string | null = null): void {
  boot = {
    locale: nextBoot?.locale ?? DEFAULT_LOCALE,
    locales: nextBoot?.locales ?? [...CLAY_LOCALES],
    messages: nextBoot?.messages ?? {},
  };
  catalogs = mergeCatalogs(CLAY_CATALOGS, boot.messages);
  locale = resolveLocale(stored);
  emitChange();
}
