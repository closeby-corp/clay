export type CellFormat = 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'relative' | 'bytes';
export type CellFormatOptions = { currency?: string; locale?: string; decimals?: number };

const NUMERIC_RE = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

const formatterCache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>();

function cached<T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>(
  key: string,
  create: () => T,
): T {
  let fmt = formatterCache.get(key) as T | undefined;
  if (!fmt) {
    fmt = create();
    formatterCache.set(key, fmt);
  }
  return fmt;
}

function toNumber(value: unknown): number | null {
  let n: number;
  if (typeof value === 'number') {
    n = value;
  } else if (typeof value === 'string') {
    const s = value.trim();
    if (!NUMERIC_RE.test(s)) return null;
    n = Number(s);
  } else {
    return null;
  }
  return Number.isFinite(n) ? n : null;
}

function toDate(value: unknown): Date | null {
  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === 'number' || typeof value === 'string') {
    d = new Date(value);
  } else {
    return null;
  }
  return Number.isNaN(d.getTime()) ? null : d;
}

function digitOptions(decimals: number | undefined, fallbackMin: number, fallbackMax: number) {
  if (decimals === undefined) return { minimumFractionDigits: fallbackMin, maximumFractionDigits: fallbackMax };
  return { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
}

function formatNumber(n: number, locale: string | undefined, decimals: number | undefined): string {
  const fmt = cached(`number|${locale ?? ''}|${decimals ?? ''}`, () =>
    new Intl.NumberFormat(locale, digitOptions(decimals, 0, 3)),
  ) as Intl.NumberFormat;
  return fmt.format(n);
}

function formatCurrency(n: number, opts: CellFormatOptions): string {
  const currency = opts.currency ?? 'USD';
  const fmt = cached(`currency|${opts.locale ?? ''}|${currency}|${opts.decimals ?? ''}`, () =>
    new Intl.NumberFormat(opts.locale, { style: 'currency', currency, ...digitOptions(opts.decimals, 2, 2) }),
  ) as Intl.NumberFormat;
  return fmt.format(n);
}

function formatPercent(n: number, opts: CellFormatOptions): string {
  const decimals = opts.decimals ?? 0;
  const fmt = cached(`percent|${opts.locale ?? ''}|${decimals}`, () =>
    new Intl.NumberFormat(opts.locale, { style: 'percent', ...digitOptions(decimals, 0, 0) }),
  ) as Intl.NumberFormat;
  return fmt.format(n);
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

function formatBytes(n: number, opts: CellFormatOptions): string {
  const abs = Math.abs(n);
  let unitIndex = 0;
  let scaled = abs;
  while (scaled >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    scaled /= 1024;
    unitIndex++;
  }
  const sign = n < 0 ? -1 : 1;
  if (unitIndex === 0) {
    const fmt = cached(`bytes-b|${opts.locale ?? ''}`, () =>
      new Intl.NumberFormat(opts.locale, { maximumFractionDigits: 0 }),
    ) as Intl.NumberFormat;
    return `${fmt.format(sign * abs)} B`;
  }
  const decimals = opts.decimals ?? 1;
  const fmt = cached(`bytes|${opts.locale ?? ''}|${decimals}`, () =>
    new Intl.NumberFormat(opts.locale, digitOptions(decimals, 1, 1)),
  ) as Intl.NumberFormat;
  return `${fmt.format(sign * scaled)} ${BYTE_UNITS[unitIndex]}`;
}

function formatDate(d: Date, opts: CellFormatOptions): string {
  const fmt = cached(`date|${opts.locale ?? ''}`, () =>
    new Intl.DateTimeFormat(opts.locale, { dateStyle: 'medium' }),
  ) as Intl.DateTimeFormat;
  return fmt.format(d);
}

function formatDateTime(d: Date, opts: CellFormatOptions): string {
  const fmt = cached(`datetime|${opts.locale ?? ''}`, () =>
    new Intl.DateTimeFormat(opts.locale, { dateStyle: 'medium', timeStyle: 'short' }),
  ) as Intl.DateTimeFormat;
  return fmt.format(d);
}

const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

function formatRelative(d: Date, opts: CellFormatOptions, now: Date): string {
  const diffSeconds = (d.getTime() - now.getTime()) / 1000;
  const abs = Math.abs(diffSeconds);

  let unit: Intl.RelativeTimeFormatUnit;
  let unitSeconds: number;
  if (abs < MINUTE) {
    unit = 'second';
    unitSeconds = SECOND;
  } else if (abs < HOUR) {
    unit = 'minute';
    unitSeconds = MINUTE;
  } else if (abs < DAY) {
    unit = 'hour';
    unitSeconds = HOUR;
  } else if (abs < WEEK) {
    unit = 'day';
    unitSeconds = DAY;
  } else if (abs < 5 * WEEK) {
    unit = 'week';
    unitSeconds = WEEK;
  } else if (abs < 12 * MONTH) {
    unit = 'month';
    unitSeconds = MONTH;
  } else {
    unit = 'year';
    unitSeconds = YEAR;
  }

  const fmt = cached(`relative|${opts.locale ?? ''}`, () =>
    new Intl.RelativeTimeFormat(opts.locale, { numeric: 'auto' }),
  ) as Intl.RelativeTimeFormat;
  return fmt.format(Math.round(diffSeconds / unitSeconds), unit);
}

/** Returns display text, or null when the value can't be formatted (caller then renders the raw value). */
export function formatCell(
  value: unknown,
  format: CellFormat,
  opts: CellFormatOptions = {},
  now: Date = new Date(),
): string | null {
  if (value === null || value === undefined || value === '') return null;

  switch (format) {
    case 'number': {
      const n = toNumber(value);
      return n === null ? null : formatNumber(n, opts.locale, opts.decimals);
    }
    case 'currency': {
      const n = toNumber(value);
      return n === null ? null : formatCurrency(n, opts);
    }
    case 'percent': {
      const n = toNumber(value);
      return n === null ? null : formatPercent(n, opts);
    }
    case 'bytes': {
      const n = toNumber(value);
      return n === null ? null : formatBytes(n, opts);
    }
    case 'date': {
      const d = toDate(value);
      return d === null ? null : formatDate(d, opts);
    }
    case 'datetime': {
      const d = toDate(value);
      return d === null ? null : formatDateTime(d, opts);
    }
    case 'relative': {
      const d = toDate(value);
      return d === null ? null : formatRelative(d, opts, now);
    }
    default:
      return null;
  }
}
