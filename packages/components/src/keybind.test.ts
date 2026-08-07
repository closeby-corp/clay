import { describe, expect, test } from 'bun:test';
import { keybind } from './keybind';

describe('keybind', () => {
  test('factory sets defaults and press event', () => {
    const el = keybind({
      keys: 'mod+s',
      onPress: () => {},
    });
    expect(el.type).toBe('keybind');
    expect(el.props.keys).toBe('mod+s');
    expect(el.props.enabled).toBe(true);
    expect(el.props.preventDefault).toBe(true);
    expect(el.props.ignoreInput).toBe(true);
    expect(el.props.events).toEqual(expect.arrayContaining(['press']));
    expect(el.props.onPress).toBeUndefined();
  });

  test('accepts keys array and option overrides', () => {
    const el = keybind({
      keys: ['mod+s', 'ctrl+s'],
      enabled: false,
      preventDefault: false,
      ignoreInput: false,
    });
    expect(el.props.keys).toEqual(['mod+s', 'ctrl+s']);
    expect(el.props.enabled).toBe(false);
    expect(el.props.preventDefault).toBe(false);
    expect(el.props.ignoreInput).toBe(false);
    expect(el.props.events).toBeUndefined();
  });

  test('handleEvent press invokes onPress', async () => {
    let pressed = 0;
    const el = keybind({
      keys: 'mod+k',
      onPress: () => {
        pressed += 1;
      },
    });
    await el.handleEvent('press');
    expect(pressed).toBe(1);
  });
});
