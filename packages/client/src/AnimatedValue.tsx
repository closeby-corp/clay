import NumberFlow from '@number-flow/react';

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

export function AnimatedValue({ value }: { value: string | number }) {
  if (typeof value === 'number') return <NumberFlow value={value} />;
  const parsed = parseAnimatedValue(value);
  return parsed ? <NumberFlow {...parsed} /> : value;
}
