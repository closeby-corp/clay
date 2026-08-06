import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  applyServerTheme,
  isThemeMode,
  readStoredTheme,
  registerThemeSetter,
  type ThemeMode,
} from './themeBridge';

/** Wires next-themes to server `theme` ops and restores `badui-theme` on load. */
export function ThemeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const apply = (theme: ThemeMode) => setTheme(theme);
    registerThemeSetter(apply);
    const stored = readStoredTheme();
    if (isThemeMode(stored)) applyServerTheme(stored);
    return () => registerThemeSetter(null);
  }, [setTheme]);

  return null;
}
