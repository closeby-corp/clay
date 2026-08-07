import { Element } from '@badui/core';

export type KbdProps = {
  /**
   * Chord string(s), e.g. `'mod+s'` or `['mod+s', 'ctrl+s']`.
   * Same token grammar as `ui.keybind` / `KeybindProps.keys`.
   */
  keys: string | string[];
  className?: string;
};

/**
 * Display-only keyboard chord glyphs (ShadCN `Kbd` / `KbdGroup` on the client).
 * Does not listen for keydowns — pair with `ui.keybind` for behavior.
 */
export function kbd(keys: string | string[], props?: Omit<KbdProps, 'keys'>): Element;
export function kbd(props: KbdProps): Element;
export function kbd(
  keysOrProps: string | string[] | KbdProps,
  props: Omit<KbdProps, 'keys'> = {},
): Element {
  if (
    typeof keysOrProps === 'object' &&
    keysOrProps !== null &&
    !Array.isArray(keysOrProps) &&
    'keys' in keysOrProps
  ) {
    return new Element('kbd', {
      keys: keysOrProps.keys,
      className: keysOrProps.className,
    });
  }
  return new Element('kbd', {
    keys: keysOrProps as string | string[],
    className: props.className,
  });
}
