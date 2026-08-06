import { describe, expect, test } from 'bun:test';
import { Element, validate } from './index';

describe('validate', () => {
  test('returns false and sets errors when checks fail', () => {
    const name = new Element('input', { value: '' });
    const email = new Element('input', { value: 'bad' });

    const ok = validate([
      { el: name, check: () => 'Name is required' },
      { el: email, check: () => 'Enter a valid email' },
    ]);

    expect(ok).toBe(false);
    expect(name.props.error).toBe('Name is required');
    expect(email.props.error).toBe('Enter a valid email');
  });

  test('returns true and clears errors when all pass', () => {
    const name = new Element('input', { value: 'Ada', error: 'stale' });
    const terms = new Element('checkbox', { value: true, error: 'stale' });

    const ok = validate([
      { el: name, check: () => null },
      { el: terms, check: () => undefined },
    ]);

    expect(ok).toBe(true);
    expect(name.props.error).toBeUndefined();
    expect(terms.props.error).toBeUndefined();
  });
});
