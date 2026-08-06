import { getCurrentSession } from './context';

export type ThemeMode = 'light' | 'dark' | 'system';

const lastThemeBySession = new WeakMap<object, ThemeMode>();

export function setTheme(theme: ThemeMode): void {
  const session = getCurrentSession();
  if (!session) return;
  lastThemeBySession.set(session, theme);
  session.setTheme(theme);
}

export function getTheme(): ThemeMode | null {
  const session = getCurrentSession();
  if (!session) return null;
  return lastThemeBySession.get(session) ?? null;
}

export const theme = {
  set: setTheme,
  get: getTheme,
};
