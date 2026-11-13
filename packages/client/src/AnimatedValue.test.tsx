import { describe, expect, test } from 'bun:test';
import { parseAnimatedValue } from './AnimatedValue';

describe('parseAnimatedValue', () => {
  test.each([
    ['$1,250.00', 1250, '$', '', 2, true],
    ['12.5%', 12.5, '', '%', 1, false],
    ['-3', -3, '', '', 0, false],
    ['4.2k', 4.2, '', 'k', 1, false],
    ['1,234 users', 1234, '', ' users', 0, true],
  ] as const)('parses %s', (input, value, prefix, suffix, decimals, useGrouping) => {
    expect(parseAnimatedValue(input)).toEqual({
      value, prefix, suffix,
      format: { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping },
    });
  });

  test.each(['abc', '1,23', '1.2.3', '1 / 2', '--3', '1e3'])('preserves ambiguous or nonnumeric %s', input => {
    expect(parseAnimatedValue(input)).toBeNull();
  });
});
