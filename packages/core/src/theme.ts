import { getCurrentSession } from './context';

/** Appearance mode pushed to the client (`system` follows OS preference). */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Built-in palettes shipped with the client (`kiln` is the default). Custom names work too. */
export const THEME_PALETTES = [
  'kiln',
  'cobalt',
  'ocean',
  'forest',
  'orchid',
  'citrus',
  'graphite',
  'neon',
  'sky',
  'navy',
  'indigo',
  'denim',
  'midnight',
] as const;

/** A built-in palette name, or any custom `:root[data-palette="…"]` defined in app CSS. */
export type ThemePalette = (typeof THEME_PALETTES)[number] | (string & {});

const lastThemeBySession = new WeakMap<object, ThemeMode>();
const lastPaletteBySession = new WeakMap<object, ThemePalette>();

/** Set appearance for the current session. Prefer `ui.theme.set`. */
export function setTheme(theme: ThemeMode): void {
  const session = getCurrentSession();
  if (!session) return;
  lastThemeBySession.set(session, theme);
  session.setTheme(theme);
}

/** Last theme set for this session, or `null` if unset / no session. */
export function getTheme(): ThemeMode | null {
  const session = getCurrentSession();
  if (!session) return null;
  return lastThemeBySession.get(session) ?? null;
}

/**
 * Switch the colour palette for the current session (`ui.theme.palette('ocean')`).
 * The client applies `<html data-palette>` and remembers it across reloads.
 */
export function setPalette(palette: ThemePalette): void {
  const session = getCurrentSession();
  if (!session) return;
  const name = String(palette).trim();
  if (!/^[a-z0-9-]+$/i.test(name)) throw new Error(`Invalid palette name: ${palette}`);
  lastPaletteBySession.set(session, name);
  session.setPalette(name);
}

/**
 * Palette for this session: the last `ui.theme.palette(…)` call, else what the client
 * reported on connect (restored choice / server default), else `null`.
 */
export function getPalette(): ThemePalette | null {
  const session = getCurrentSession();
  if (!session) return null;
  return lastPaletteBySession.get(session) ?? session.clientPalette ?? null;
}

/** Server-driven appearance (`ui.theme.set` / `ui.theme.get` / `ui.theme.palette`). */
export const theme = {
  set: setTheme,
  get: getTheme,
  palette: setPalette,
  getPalette,
  palettes: THEME_PALETTES,
};
