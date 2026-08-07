import { describe, expect, test } from 'bun:test';
import { kbd } from './kbd';

describe('kbd', () => {
  test('string keys shorthand', () => {
    const el = kbd('mod+k');
    expect(el.type).toBe('kbd');
    expect(el.props.keys).toBe('mod+k');
    expect(el.props.className).toBeUndefined();
  });

  test('keys array shorthand with className', () => {
    const el = kbd(['mod+k', 'ctrl+k'], { className: 'ml-1' });
    expect(el.props.keys).toEqual(['mod+k', 'ctrl+k']);
    expect(el.props.className).toBe('ml-1');
  });

  test('props-object form', () => {
    const el = kbd({ keys: 'mod+s', className: 'gap-0.5' });
    expect(el.type).toBe('kbd');
    expect(el.props.keys).toBe('mod+s');
    expect(el.props.className).toBe('gap-0.5');
  });

  test('display-only — no events', () => {
    const el = kbd('mod+k');
    expect(el.props.events).toBeUndefined();
  });
});
