import { describe, expect, test } from 'bun:test';
import { checkClayPageModule, looksLikeClayPage } from './page-globals.ts';

describe('looksLikeClayPage', () => {
  test('detects ui.page', () => {
    expect(
      looksLikeClayPage(`import { ui } from '@close-by/clay';\nui.page('/', () => {});`),
    ).toBe(true);
  });

  test('detects default export page', () => {
    expect(
      looksLikeClayPage(`import { ui } from '@close-by/clay';\nexport default function () {}`),
    ).toBe(true);
  });

  test('ignores unrelated modules', () => {
    expect(looksLikeClayPage(`export function helper() { return 1; }`)).toBe(false);
  });
});

describe('checkClayPageModule', () => {
  test('warns on window reference in page code', () => {
    const src = `import { ui } from '@close-by/clay';
ui.page('/', () => {
  window.location.hash = 'x';
});`;
    const { warnings, looksLikePage } = checkClayPageModule(src, 'page.ts');
    expect(looksLikePage).toBe(true);
    expect(warnings.some((w) => w.includes('`window`'))).toBe(true);
    expect(warnings.some((w) => w.includes('line 3'))).toBe(true);
  });

  test('warns on navigator.clipboard pattern', () => {
    const src = `import { ui } from '@close-by/clay';
export default function () {
  navigator.clipboard.writeText('x');
}`;
    const { warnings } = checkClayPageModule(src);
    expect(warnings.some((w) => w.includes('`navigator`'))).toBe(true);
  });

  test('ignores string literals mentioning window', () => {
    const src = `import { ui } from '@close-by/clay';
ui.page('/', () => {
  ui.label('drag near the scroll edge to reach off-window rows');
});`;
    const { warnings } = checkClayPageModule(src);
    expect(warnings).toHaveLength(0);
  });

  test('skips non-page modules', () => {
    const src = `window.location.hash = 'x';`;
    const { warnings, looksLikePage } = checkClayPageModule(src);
    expect(looksLikePage).toBe(false);
    expect(warnings).toHaveLength(0);
  });
});
