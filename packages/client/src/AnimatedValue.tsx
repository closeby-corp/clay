import NumberFlow from '@number-flow/react';
import { useLocale } from './i18n';

export function parseAnimatedValue(value: string) {
  const match = value.match(/^([^\d.,+\-]*)([+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)([^\d.,+\-]*)$/);
  if (!match) return null;
  const [, prefix, numeric, suffix] = match;
  const n = Number(numeric.replaceAll(',', ''));
  const d = numeric.split('.')[1]?.length ?? 0;
  if (!Number.isFinite(n) || d > 20) return null;
  return {
    value: n,
    prefix,
    suffix,
    format: { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: numeric.includes(',') },
  };
}

/**
 * Stat value. Numbers and English-formatted numeric strings are re-rendered with the active
 * locale's separators, keeping any prefix/suffix (pt-PT: `$1,250.00` → `$1250,00`).
 */
export function AnimatedValue({ value }: { value: string | number }) {
  const locale = useLocale();
  if (typeof value === 'number') return <NumberFlow value={value} locales={locale} />;
  const parsed = parseAnimatedValue(value);
  return parsed ? <NumberFlow {...parsed} locales={locale} /> : value;
}
