import { describe, expect, test } from 'bun:test';
import { formatCell } from './formatCell';

const L = 'en-US';
const NOW = new Date('2024-06-01T12:00:00Z');

describe('formatCell: empty and invalid inputs', () => {
  test('null, undefined and empty string return null for every format', () => {
    for (const format of ['number', 'currency', 'percent', 'date', 'datetime', 'relative', 'bytes'] as const) {
      expect(formatCell(null, format, { locale: L }, NOW)).toBeNull();
      expect(formatCell(undefined, format, { locale: L }, NOW)).toBeNull();
      expect(formatCell('', format, { locale: L }, NOW)).toBeNull();
    }
  });

  test('non-numeric values return null for numeric formats', () => {
    for (const format of ['number', 'currency', 'percent', 'bytes'] as const) {
      expect(formatCell('abc', format, { locale: L })).toBeNull();
      expect(formatCell('12px', format, { locale: L })).toBeNull();
      expect(formatCell('0x1F', format, { locale: L })).toBeNull();
      expect(formatCell(NaN, format, { locale: L })).toBeNull();
      expect(formatCell(Infinity, format, { locale: L })).toBeNull();
      expect(formatCell(true, format, { locale: L })).toBeNull();
      expect(formatCell({}, format, { locale: L })).toBeNull();
    }
  });

  test('invalid dates return null for date formats', () => {
    for (const format of ['date', 'datetime', 'relative'] as const) {
      expect(formatCell('not a date', format, { locale: L }, NOW)).toBeNull();
      expect(formatCell(new Date('nope'), format, { locale: L }, NOW)).toBeNull();
      expect(formatCell({}, format, { locale: L }, NOW)).toBeNull();
    }
  });
});

describe('formatCell: number', () => {
  test('groups thousands with default max 3 fraction digits', () => {
    expect(formatCell(1234567.8912, 'number', { locale: L })).toBe('1,234,567.891');
  });

  test('accepts numeric strings', () => {
    expect(formatCell('1234.5', 'number', { locale: L })).toBe('1,234.5');
    expect(formatCell(' -42 ', 'number', { locale: L })).toBe('-42');
  });

  test('decimals fixes both min and max fraction digits', () => {
    expect(formatCell(1234.5, 'number', { locale: L, decimals: 2 })).toBe('1,234.50');
    expect(formatCell(1.23456, 'number', { locale: L, decimals: 0 })).toBe('1');
  });
});

describe('formatCell: currency', () => {
  test('defaults to USD with two decimals', () => {
    expect(formatCell(1234.5, 'currency', { locale: L })).toBe('$1,234.50');
  });

  test('accepts numeric strings', () => {
    expect(formatCell('1234.5', 'currency', { locale: L })).toBe('$1,234.50');
  });

  test('uses the given currency code', () => {
    expect(formatCell(1234.5, 'currency', { locale: L, currency: 'EUR' })).toBe('€1,234.50');
  });

  test('decimals overrides the currency default', () => {
    expect(formatCell(1234.5, 'currency', { locale: L, decimals: 0 })).toBe('$1,235');
    expect(formatCell(1234.5, 'currency', { locale: L, currency: 'EUR', decimals: 3 })).toBe('€1,234.500');
  });
});

describe('formatCell: percent', () => {
  test('treats value as a ratio with zero decimals by default', () => {
    expect(formatCell(0.25, 'percent', { locale: L })).toBe('25%');
    expect(formatCell(1, 'percent', { locale: L })).toBe('100%');
  });

  test('accepts numeric strings', () => {
    expect(formatCell('0.5', 'percent', { locale: L })).toBe('50%');
  });

  test('decimals controls fraction digits', () => {
    expect(formatCell(0.256, 'percent', { locale: L, decimals: 1 })).toBe('25.6%');
  });
});

describe('formatCell: bytes', () => {
  test('values below 1024 are whole bytes', () => {
    expect(formatCell(0, 'bytes', { locale: L })).toBe('0 B');
    expect(formatCell(512, 'bytes', { locale: L })).toBe('512 B');
    expect(formatCell(1023, 'bytes', { locale: L })).toBe('1,023 B');
  });

  test('crosses thresholds at 1024 multiples with one decimal', () => {
    expect(formatCell(1024, 'bytes', { locale: L })).toBe('1.0 KB');
    expect(formatCell(1536, 'bytes', { locale: L })).toBe('1.5 KB');
    expect(formatCell(1024 * 1024 - 1, 'bytes', { locale: L })).toBe('1,024.0 KB');
    expect(formatCell(1024 ** 2, 'bytes', { locale: L })).toBe('1.0 MB');
    expect(formatCell(1024 ** 3 * 2.5, 'bytes', { locale: L })).toBe('2.5 GB');
    expect(formatCell(1024 ** 4, 'bytes', { locale: L })).toBe('1.0 TB');
    expect(formatCell(1024 ** 5, 'bytes', { locale: L })).toBe('1,024.0 TB');
  });

  test('accepts numeric strings and decimals override', () => {
    expect(formatCell('1536', 'bytes', { locale: L })).toBe('1.5 KB');
    expect(formatCell(1536, 'bytes', { locale: L, decimals: 2 })).toBe('1.50 KB');
  });
});

describe('formatCell: date and datetime', () => {
  // Local-time constructor keeps the output independent of the machine's timezone.
  const d = new Date(2024, 2, 15, 14, 30);

  test('date uses medium date style', () => {
    expect(formatCell(d, 'date', { locale: L })).toBe('Mar 15, 2024');
  });

  test('datetime uses medium date and short time style', () => {
    const out = formatCell(d, 'datetime', { locale: L });
    expect(out).not.toBeNull();
    expect(out).toContain('Mar 15, 2024');
    expect(out).toMatch(/2:30\s?PM/);
  });

  test('accepts epoch milliseconds and ISO strings', () => {
    expect(formatCell(d.getTime(), 'date', { locale: L })).toBe('Mar 15, 2024');
    expect(formatCell(d.toISOString(), 'date', { locale: L })).toBe('Mar 15, 2024');
  });
});

describe('formatCell: relative', () => {
  test('past times', () => {
    expect(formatCell(new Date(NOW.getTime() - 30_000), 'relative', { locale: L }, NOW)).toBe('30 seconds ago');
    expect(formatCell(new Date(NOW.getTime() - 5 * 60_000), 'relative', { locale: L }, NOW)).toBe('5 minutes ago');
    expect(formatCell(new Date(NOW.getTime() - 3 * 3600_000), 'relative', { locale: L }, NOW)).toBe('3 hours ago');
    expect(formatCell(new Date(NOW.getTime() - 86_400_000), 'relative', { locale: L }, NOW)).toBe('yesterday');
    expect(formatCell(new Date(NOW.getTime() - 3 * 86_400_000), 'relative', { locale: L }, NOW)).toBe('3 days ago');
    expect(formatCell(new Date(NOW.getTime() - 3 * 7 * 86_400_000), 'relative', { locale: L }, NOW)).toBe('3 weeks ago');
    expect(formatCell(new Date(NOW.getTime() - 3 * 30 * 86_400_000), 'relative', { locale: L }, NOW)).toBe('3 months ago');
    expect(formatCell(new Date(NOW.getTime() - 2 * 365 * 86_400_000), 'relative', { locale: L }, NOW)).toBe('2 years ago');
  });

  test('future times', () => {
    expect(formatCell(new Date(NOW.getTime() + 2 * 3600_000), 'relative', { locale: L }, NOW)).toBe('in 2 hours');
    expect(formatCell(new Date(NOW.getTime() + 86_400_000), 'relative', { locale: L }, NOW)).toBe('tomorrow');
    expect(formatCell(new Date(NOW.getTime() + 14 * 86_400_000), 'relative', { locale: L }, NOW)).toBe('in 2 weeks');
    expect(formatCell(new Date(NOW.getTime() + 400 * 86_400_000), 'relative', { locale: L }, NOW)).toBe('next year');
  });

  test('accepts epoch milliseconds and ISO strings', () => {
    expect(formatCell(NOW.getTime() - 3 * 86_400_000, 'relative', { locale: L }, NOW)).toBe('3 days ago');
    expect(formatCell('2024-06-04T12:00:00Z', 'relative', { locale: L }, NOW)).toBe('in 3 days');
  });

  test('defaults now to the current time', () => {
    const out = formatCell(new Date(Date.now() - 2 * 3600_000), 'relative', { locale: L });
    expect(out).toBe('2 hours ago');
  });
});
