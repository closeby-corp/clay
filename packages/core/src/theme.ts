import { getCurrentSession } from './context';

/** Appearance mode pushed to the client (`system` follows OS preference). */
export type ThemeMode = 'light' | 'dark' | 'system';

const lastThemeBySession = new WeakMap<object, ThemeMode>();

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

/** Server-driven appearance (`ui.theme.set` / `ui.theme.get`). */
export const theme = {
  set: setTheme,
  get: getTheme,
};
