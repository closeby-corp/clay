import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
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
      const pages = join(root, 'pages');
      mkdirSync(pages);
      writeFileSync(
        join(pages, 'home.ts'),
        `ui.label('x').classes('w-[17rem] text-[11px] bg-primary');\n`,
        'utf8',
      );

      const { cssPath, stop } = ensureClayTailwindCss({
        content: [pages],
        cwd: root,
        outFile: join(root, '.clay', 'tailwind.css'),
      });
      stop();

      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('17rem');
      expect(css).toContain('11px');
      expect(css.length).toBeGreaterThan(50);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
