import { THEME_PALETTES } from '../../core/src/theme';
import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemePicker, paletteColors } from './ThemePicker';
import { ShellStatusContext } from './ShellStatus';
import { SiteHeader } from './shell/site-header';

test('palette previews read distinct light and dark tokens from the stylesheets', () => {
  for (const palette of THEME_PALETTES) {
    for (const dark of [false, true]) {
      expect(paletteColors(palette, dark).background).toBeTruthy();
      expect(paletteColors(palette, dark).accent).toBeTruthy();
    }
  }
  expect(paletteColors('kiln', false).background).not.toBe(paletteColors('ocean', false).background);
  expect(paletteColors('ocean', true).background).not.toBe(paletteColors('ocean', false).background);
});

test('theme picker has a labeled popover trigger', () => {
  expect(renderToStaticMarkup(<ThemePicker items={[]} emit={() => {}} />)).toContain('aria-label="Theme"');
});

test('shell status renders inside the header before header actions', () => {
  const html = renderToStaticMarkup(<ShellStatusContext.Provider value={<span>Connection</span>}>
    <SiteHeader title="Page" hideTrigger actions={[<button key="theme">Theme</button>]} />
  </ShellStatusContext.Provider>);
  expect(html).toContain('data-clay-shell-status');
  expect(html.indexOf('Connection')).toBeLessThan(html.indexOf('Theme'));
});
