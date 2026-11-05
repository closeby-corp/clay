export type ThemeMode = 'light' | 'dark' | 'system';

export const CLAY_THEME_KEY = 'clay-theme';

type ThemeSetter = (theme: ThemeMode) => void;

let setter: ThemeSetter | null = null;

export function registerThemeSetter(fn: ThemeSetter | null): void {
  setter = fn;
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };

/** Run a visual change as a crossfade (View Transitions) unless unsupported or reduced motion. */
function withViewTransition(update: () => void, animate: boolean): void {
  if (typeof document === 'undefined') return update();
  const doc = document as ViewTransitionDocument;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!animate || reduce || typeof doc.startViewTransition !== 'function') return update();
  doc.startViewTransition(update);
}

/** Apply a server `theme` op (and persist via next-themes / localStorage). */
export function applyServerTheme(theme: ThemeMode, opts: { animate?: boolean } = {}): void {
  try {
    localStorage.setItem(CLAY_THEME_KEY, theme);
  } catch {
    // ignore quota / private mode
  }
  withViewTransition(() => {
    // next-themes applies the class in an effect (after the transition snapshot), so set it now.
    const root = document.documentElement;
    const resolved =
      theme === 'system'
        ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
    setter?.(theme);
  }, opts.animate ?? true);
}

export const CLAY_PALETTE_KEY = 'clay-palette';

/** Apply a server `palette` op: `<html data-palette>` + persist (empty / `kiln` = default). */
export function applyPalette(palette: string): void {
  const name = palette.replace(/[^a-z0-9-]/gi, '');
  const root = document.documentElement;
  if ((root.dataset.palette || 'kiln') !== (name || 'kiln')) {
    withViewTransition(() => {
      if (!name || name === 'kiln') delete root.dataset.palette;
      else root.dataset.palette = name;
    }, true);
  }
  try {
    if (name) localStorage.setItem(CLAY_PALETTE_KEY, name);
    else localStorage.removeItem(CLAY_PALETTE_KEY);
  } catch {
    // ignore quota / private mode
  }
}

/** Palette currently applied to the page (`kiln` when no `data-palette`). */
export function currentPalette(): string {
  return document.documentElement.dataset.palette || 'kiln';
}

export function readStoredTheme(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(CLAY_THEME_KEY);
    return isThemeMode(stored) ? stored : null;
  } catch {
    return null;
  }
}
