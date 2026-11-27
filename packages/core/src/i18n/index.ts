/**
 * Browser-safe i18n primitives (no session / DOM access). The server runtime (`ui.setLocale`,
 * `ui.t`, `ui.messages`) lives in `../locale.ts`; the client store in `client/src/i18n.tsx`.
 */
export {
  DEFAULT_LOCALE,
  normalizeLocale,
  baseLanguage,
  matchLocale,
  fallbackChain,
  interpolate,
  translate,
  mergeCatalogs,
  type MessageDict,
  type MessageCatalogs,
  type MessageParams,
  type PluralBase,
} from './translate';
export {
  numberFormatter,
  dateFormatter,
  formatNumber,
  formatDate,
  formatRelativeTime,
  weekStartsOn,
  monthNames,
  weekdayNames,
} from './format';
export { CLAY_CATALOGS, CLAY_LOCALES, type ClayMessageKey, type ClayMessages, type ClayTranslationKey } from './catalog';
