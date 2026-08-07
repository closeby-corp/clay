export type ParsedChord = {
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  /** Platform modifier: Meta on Apple, Ctrl elsewhere. */
  mod: boolean;
  /** Normalized key token (`s`, `escape`, `arrowup`, `?`, …). */
  key: string;
};

const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  escape: 'escape',
  enter: 'enter',
  return: 'enter',
  space: 'space',
  tab: 'tab',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  arrowup: 'arrowup',
  arrowdown: 'arrowdown',
  arrowleft: 'arrowleft',
  arrowright: 'arrowright',
};

function normalizeKeyToken(token: string): string {
  const t = token.toLowerCase();
  return KEY_ALIASES[t] ?? t;
}

/** Normalize `KeyboardEvent.key` to the same space as chord key tokens. */
export function normalizeEventKey(key: string): string {
  if (key === ' ') return 'space';
  return key.toLowerCase();
}

/**
 * Parse a chord like `mod+s` or `shift+?`.
 * Unknown modifier-looking tokens are treated as the key.
 */
export function parseChord(chord: string): ParsedChord {
  const parts = chord
    .toLowerCase()
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);

  const result: ParsedChord = {
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
    mod: false,
    key: '',
  };

  for (const part of parts) {
    if (part === 'mod') result.mod = true;
    else if (part === 'ctrl' || part === 'control') result.ctrl = true;
    else if (part === 'meta' || part === 'cmd' || part === 'command') result.meta = true;
    else if (part === 'alt' || part === 'option') result.alt = true;
    else if (part === 'shift') result.shift = true;
    else result.key = normalizeKeyToken(part);
  }

  return result;
}

export function isApplePlatform(platform = typeof navigator !== 'undefined' ? navigator.platform : ''): boolean {
  return /Mac|iPhone|iPod|iPad/i.test(platform);
}

export type ChordMatchOptions = {
  /** Override platform detection (tests). Default: Apple user agents. */
  isApple?: boolean;
};

export function matchesChord(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>,
  chord: string | ParsedChord,
  opts: ChordMatchOptions = {},
): boolean {
  const parsed = typeof chord === 'string' ? parseChord(chord) : chord;
  if (!parsed.key) return false;

  const isApple = opts.isApple ?? isApplePlatform();

  let wantCtrl = parsed.ctrl;
  let wantMeta = parsed.meta;
  if (parsed.mod) {
    if (isApple) wantMeta = true;
    else wantCtrl = true;
  }

  if (!!event.ctrlKey !== wantCtrl) return false;
  if (!!event.metaKey !== wantMeta) return false;
  if (!!event.altKey !== parsed.alt) return false;
  if (!!event.shiftKey !== parsed.shift) return false;

  return normalizeEventKey(event.key) === parsed.key;
}

/** True when the event target is a text field or contenteditable. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (target == null || typeof target !== 'object') return false;
  const el = target as HTMLElement;
  const tag = typeof el.tagName === 'string' ? el.tagName.toUpperCase() : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  if (typeof el.closest === 'function' && el.closest('[contenteditable="true"]')) return true;
  return false;
}

export function chordList(keys: unknown): string[] {
  if (Array.isArray(keys)) return keys.map(String).filter(Boolean);
  if (typeof keys === 'string' && keys.trim()) return [keys];
  return [];
}

const KEY_DISPLAY: Record<string, string> = {
  escape: 'Esc',
  enter: '↵',
  space: 'Space',
  tab: 'Tab',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
};

function formatKeyToken(token: string, isApple: boolean): string {
  if (token === 'mod') return isApple ? '⌘' : 'Ctrl';
  if (token === 'ctrl' || token === 'control') return 'Ctrl';
  if (token === 'meta' || token === 'cmd' || token === 'command') return '⌘';
  if (token === 'alt' || token === 'option') return isApple ? '⌥' : 'Alt';
  if (token === 'shift') return '⇧';

  const key = normalizeKeyToken(token);
  if (KEY_DISPLAY[key]) return KEY_DISPLAY[key];
  if (key.length === 1) return key.toUpperCase();
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export type ChordDisplayOptions = {
  /** Override platform detection (tests). Default: Apple user agents. */
  isApple?: boolean;
};

/**
 * Format one chord (`mod+s`) into display segments (`['⌘','S']` on Apple).
 * Token order matches the chord string.
 */
export function formatChordSegments(
  chord: string,
  opts: ChordDisplayOptions = {},
): string[] {
  const isApple = opts.isApple ?? isApplePlatform();
  return chord
    .toLowerCase()
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((part) => formatKeyToken(part, isApple));
}

/**
 * Format chord string(s) into platform-aware glyph segments per chord.
 * e.g. `formatChordDisplay('mod+k')` → `[['⌘','K']]` on Apple.
 */
export function formatChordDisplay(
  keys: string | string[],
  opts: ChordDisplayOptions = {},
): string[][] {
  return chordList(keys).map((chord) => formatChordSegments(chord, opts));
}
