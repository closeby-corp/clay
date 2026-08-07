import { Element } from '@badui/core';

export type KeybindProps = {
  /**
   * Chord string(s), e.g. `'mod+s'` or `['mod+s', 'ctrl+s']`.
   * Tokens are `+`-joined and case-insensitive.
   */
  keys: string | string[];
  /** When false, the client does not listen (default `true`). */
  enabled?: boolean;
  /** Call `preventDefault` on a matching keydown (default `true`). */
  preventDefault?: boolean;
  /**
   * Skip when focus is in `input` / `textarea` / `select` / `contenteditable`
   * (default `true`).
   */
  ignoreInput?: boolean;
  /** Fired when a chord matches (client emits `press`). */
  onPress?: () => void | Promise<void>;
};

/**
 * Headless keyboard chord listener. Renders nothing; the client attaches a
 * `window` `keydown` handler while this node is in the tree.
 */
export function keybind(props: KeybindProps): Element {
  return new Element('keybind', {
    keys: props.keys,
    enabled: props.enabled ?? true,
    preventDefault: props.preventDefault ?? true,
    ignoreInput: props.ignoreInput ?? true,
    onPress: props.onPress,
  });
}
