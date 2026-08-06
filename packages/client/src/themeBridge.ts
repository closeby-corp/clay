export type ThemeMode = 'light' | 'dark' | 'system';

export const BADUI_THEME_KEY = 'badui-theme';

type ThemeSetter = (theme: ThemeMode) => void;

let setter: ThemeSetter | null = null;

export function registerThemeSetter(fn: ThemeSetter | null): void {
  setter = fn;
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Apply a server `theme` op (and persist via next-themes / localStorage). */
export function applyServerTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(BADUI_THEME_KEY, theme);
  } catch {
    // ignore quota / private mode
  }
  setter?.(theme);
}

export function readStoredTheme(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(BADUI_THEME_KEY);
    return isThemeMode(stored) ? stored : null;
  } catch {
    return null;
  }
}
