/**
 * Locale-aware formatting helpers built on `Intl`. Shared by server and client; each takes an
 * explicit locale so callers decide where it comes from (session on the server, the client
 * locale store in the browser).
 */

function safe<T>(fn: () => T, fallback: () => T): T {
  try {
    return fn();
  } catch {
    return fallback();
  }
}

const nfCache = new Map<string, Intl.NumberFormat>();
const dtfCache = new Map<string, Intl.DateTimeFormat>();

/** Cached `Intl.NumberFormat` (falls back to `en` for unknown locales / bad options). */
export function numberFormatter(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${options ? JSON.stringify(options) : ''}`;
  let f = nfCache.get(key);
  if (!f) {
    f = safe(() => new Intl.NumberFormat(locale, options), () => new Intl.NumberFormat('en', options));
    nfCache.set(key, f);
  }
  return f;
}

/** Cached `Intl.DateTimeFormat` (falls back to `en` for unknown locales). */
export function dateFormatter(locale: string, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${options ? JSON.stringify(options) : ''}`;
  let f = dtfCache.get(key);
  if (!f) {
    f = safe(() => new Intl.DateTimeFormat(locale, options), () => new Intl.DateTimeFormat('en', options));
    dtfCache.set(key, f);
  }
  return f;
}

/** Format a number for `locale` (`1234.5` → `1 234,5` in `pt-PT`). */
export function formatNumber(locale: string, value: number, options?: Intl.NumberFormatOptions): string {
  return numberFormatter(locale, options).format(value);
}

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Format a date for `locale`. Default `{ dateStyle: 'medium' }`. Invalid dates → `''`. */
export function formatDate(
  locale: string,
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return '';
  return dateFormatter(locale, options).format(d);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

/**
 * Relative time for `locale` (`há 3 minutos`, `in 2 days`). Picks the largest whole unit.
 * `numeric: 'auto'` gives `ontem` / `yesterday` where the locale has a word for it.
 */
export function formatRelativeTime(
  locale: string,
  value: Date | string | number,
  now: Date | number = Date.now(),
  options: Intl.RelativeTimeFormatOptions = { numeric: 'auto' },
): string {
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return '';
  const diffSec = (d.getTime() - (now instanceof Date ? now.getTime() : now)) / 1000;
  const abs = Math.abs(diffSec);
  const rtf = safe(() => new Intl.RelativeTimeFormat(locale, options), () => new Intl.RelativeTimeFormat('en', options));
  for (const [unit, secs] of RELATIVE_UNITS) {
    if (abs >= secs || unit === 'second') {
      return rtf.format(Math.round(diffSec / secs), unit);
    }
  }
  return rtf.format(0, 'second');
}

/** Fallback when `getWeekInfo` is missing: regions whose week starts on Sunday (CLDR subset). */
const SUNDAY_REGIONS = new Set([
  'US', 'CA', 'BR', 'MX', 'JP', 'KR', 'CN', 'TW', 'HK', 'IL', 'IN', 'PH', 'ZA', 'AU', 'SA', 'PE', 'CO', 'VE', 'AR',
]);
/**
 * Regions where CLDR's week data disagrees with local business practice. CLDR lists Portugal
 * as Sunday-first, but Portuguese calendars and NP EN ISO 8601 start on Monday.
 */
const WEEK_START_OVERRIDES: Record<string, 0 | 1> = { PT: 1 };
/** Languages whose bare tag implies a Sunday-start region. */
const SUNDAY_LANGUAGES = new Set(['en', 'ja', 'ko', 'zh', 'he', 'hi']);

/**
 * First day of the week for `locale` as a JS weekday (`0` = Sunday, `1` = Monday).
 * Uses `Intl.Locale#getWeekInfo` when the runtime has it, else a small CLDR-derived table.
 */
export function weekStartsOn(locale: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const region = loc.region ?? loc.maximize().region;
    if (region && region in WEEK_START_OVERRIDES) return WEEK_START_OVERRIDES[region]!;
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info && typeof info.firstDay === 'number') return (info.firstDay % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    if (region) return SUNDAY_REGIONS.has(region) ? 0 : 1;
    return SUNDAY_LANGUAGES.has(loc.language) ? 0 : 1;
  } catch {
    return 0;
  }
}

/** Localised month names (`janeiro`…). `style` maps to `Intl` `month`. */
export function monthNames(locale: string, style: 'long' | 'short' | 'narrow' = 'long'): string[] {
  const f = dateFormatter(locale, { month: style, timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, m) => f.format(Date.UTC(2024, m, 1)));
}

/** Localised weekday names, index `0` = Sunday. */
export function weekdayNames(locale: string, style: 'long' | 'short' | 'narrow' = 'short'): string[] {
  const f = dateFormatter(locale, { weekday: style, timeZone: 'UTC' });
  // 2024-01-07 is a Sunday.
  return Array.from({ length: 7 }, (_, d) => f.format(Date.UTC(2024, 0, 7 + d)));
}
