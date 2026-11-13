import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import postcss from 'postcss';
import { filterClayTailwindCss } from './tailwind-dedupe.ts';
import { ensureClayTailwindCss, detectClayTailwindContent, mergeClayCss } from './tailwind.ts';

describe('mergeClayCss', () => {
  test('appends paths', () => {
    expect(mergeClayCss('./a.css', './b.css')).toEqual(['./a.css', './b.css']);
    expect(mergeClayCss(['./a.css'], ['./b.css', './c.css'])).toEqual([
      './a.css',
      './b.css',
      './c.css',
    ]);
  });
});

describe('detectClayTailwindContent', () => {
  test('finds pages/src/app', () => {
    const root = mkdtempSync(join(tmpdir(), 'clay-tw-detect-'));
    try {
      mkdirSync(join(root, 'pages'));
      mkdirSync(join(root, 'src'));
      expect(detectClayTailwindContent(root).sort()).toEqual(
        [join(root, 'pages'), join(root, 'src')].sort(),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('ensureClayTailwindCss', () => {
  test('builds utilities for class strings in content', () => {
    const root = mkdtempSync(join(tmpdir(), 'clay-tw-build-'));
    try {
      writeFileSync(join(root, 'index.css'), readFileSync(new URL('./__fixtures__/tailwind/client.css', import.meta.url)));
      const pages = join(root, 'pages');
      mkdirSync(pages);
      writeFileSync(
        join(pages, 'home.ts'),
        `ui.label('x').classes('flex hidden relative fixed w-[173.125rem] md:w-[173.125rem] text-[11.125px] bg-primary');\n`,
        'utf8',
      );

      const { cssPath, stop } = ensureClayTailwindCss({
        content: [pages],
        clientDir: root,
        cwd: root,
        outFile: join(root, '.clay', 'tailwind.css'),
      });
      stop();

      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('173.125rem');
      expect(css).toContain('.md\\:w-');
      const selectors: string[] = [];
      postcss.parse(css).walkRules(rule => { selectors.push(...rule.selectors); });
      for (const selector of ['.flex', '.hidden', '.relative', '.fixed']) {
        expect(selectors).not.toContain(selector);
      }
      expect(css).toContain('11.125px');
      expect(css.length).toBeGreaterThan(50);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});


describe('filterClayTailwindCss', () => {
  const fixture = (name: string) => readFileSync(new URL(`./__fixtures__/tailwind/${name}.css`, import.meta.url), 'utf8');
  test('matches selector lists and normalized conditions while preserving other contexts', () => {
    const css = filterClayTailwindCss(fixture('app'), fixture('client'));
    expect(css).not.toContain('.hidden');
    expect(css).not.toContain('.relative');
    expect(css).not.toContain('.fixed');
    expect(css).not.toContain('.conditional');
    expect(css.match(/\.md\\:flex/g)).toHaveLength(1);
    expect(css).toContain('width >= 49rem');
    for (const text of ['.app-only', '.md\\:app-only', '@supports (display:flex)', '@layer other', '.app-child', '--app-color', '--app-token', '@property', '@keyframes']) {
      expect(css).toContain(text);
    }
  });

  test('does not equate significant selector whitespace or quoted condition values', () => {
    const client = '@layer utilities { @supports selector(.a .b) { .flex { display:flex } } @container style(--x: "a b") { .hidden { display:none } } }';
    const app = '@layer utilities { @supports selector(.a.b) { .flex { display:flex } } @container style(--x: "ab") { .hidden { display:none } } }';
    expect(filterClayTailwindCss(app, client)).toContain('.flex');
    expect(filterClayTailwindCss(app, client)).toContain('.hidden');
  });

  test('keeps nested app rules when the parent utility is already shipped', () => {
    const client = '@layer utilities { .flex { display:flex } }';
    const app = '@layer utilities { .flex, .app-only { display:flex; & .child { color:red } } }';
    const root = postcss.parse(filterClayTailwindCss(app, client));
    const declarations: string[] = [];
    root.walkDecls('display', decl => { declarations.push((decl.parent as import('postcss').Rule).selector); });
    expect(declarations).toEqual(['.app-only']);
    expect(root.toString()).toContain('& .child');
    expect(root.toString()).toContain('.flex, .app-only');
  });

  test('preserves appendCss even when it overrides a shipped utility', () => {
    const css = filterClayTailwindCss(fixture('app'), fixture('client'), '@layer utilities { .hidden { display:block } }');
    expect(css).toContain('.hidden');
  });
});

test('watch rebuilds also remove client utilities and retain app-only additions', async () => {
  const root = mkdtempSync(join(tmpdir(), 'clay-tw-watch-'));
  let stop = () => {};
  try {
    writeFileSync(join(root, 'index.css'), readFileSync(new URL('./__fixtures__/tailwind/client.css', import.meta.url)));
    const source = join(root, 'page.ts');
    writeFileSync(source, `ui.label('x').classes('flex hidden relative fixed w-[173.125rem]');`);
    const built = ensureClayTailwindCss({ content: [source], clientDir: root, cwd: root, watch: true });
    stop = built.stop;
    await Bun.sleep(500);
    writeFileSync(source, `ui.label('x').classes('flex hidden relative fixed w-[174.125rem]');`);
    for (let i = 0; i < 100 && !readFileSync(built.cssPath, 'utf8').includes('174.125rem'); i++) await Bun.sleep(100);
    const css = readFileSync(built.cssPath, 'utf8');
    expect(css).toContain('174.125rem');
    const selectors: string[] = [];
    postcss.parse(css).walkRules(rule => { selectors.push(...rule.selectors); });
    for (const selector of ['.flex', '.hidden', '.relative', '.fixed']) expect(selectors).not.toContain(selector);
  } finally {
    stop();
    await Bun.sleep(100);
    rmSync(root, { recursive: true, force: true });
  }
}, 15000);


test('missing client CSS keeps generated utilities and appendCss', () => {
  const root = mkdtempSync(join(tmpdir(), 'clay-tw-missing-'));
  try {
    const source = join(root, 'page.ts');
    writeFileSync(source, `ui.label('x').classes('flex hidden');`);
    const built = ensureClayTailwindCss({
      content: [source], cwd: root, clientDir: root,
      appendCss: ':root { --app-token: red } .flex { color: red }',
    });
    built.stop();
    const css = readFileSync(built.cssPath, 'utf8');
    expect(css).toBe(readFileSync(`${built.cssPath}.generated`, 'utf8'));
    expect(css).toContain('.flex');
    expect(css).toContain('.hidden');
    expect(css).toContain('--app-token');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
