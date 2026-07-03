import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { transformSource } from './transform';

const fixturesDir = join(import.meta.dir, 'fixtures');

function fixture(name: string): { input: string; expected: string } {
  return {
    input: readFileSync(join(fixturesDir, `${name}.in.ts`), 'utf-8'),
    expected: readFileSync(join(fixturesDir, `${name}.out.ts`), 'utf-8'),
  };
}

function normalize(code: string): string {
  return code.replace(/\r\n/g, '\n').trim();
}

describe('transformSource', () => {
  test('counter page', () => {
    const { input, expected } = fixture('counter');
    expect(normalize(transformSource(input, 'counter.ts'))).toBe(normalize(expected));
  });

  test('shadowing in nested scope', () => {
    const { input, expected } = fixture('shadowing');
    expect(normalize(transformSource(input, 'shadowing.ts'))).toBe(normalize(expected));
  });

  test('skips pages that already use ({ state })', () => {
    const { input, expected } = fixture('skip-state');
    expect(normalize(transformSource(input, 'skip-state.ts'))).toBe(normalize(expected));
  });

  test('excludes input factory initializers', () => {
    const { input, expected } = fixture('input-exclusion');
    expect(normalize(transformSource(input, 'input-exclusion.ts'))).toBe(normalize(expected));
  });

  test('auto-binds reactive template literals in label/button', () => {
    const { input, expected } = fixture('template-bind');
    expect(normalize(transformSource(input, 'template-bind.ts'))).toBe(normalize(expected));
  });

  test('desugars += and ++ before reactive rewrite', () => {
    const { input, expected } = fixture('compound-assign');
    expect(normalize(transformSource(input, 'compound-assign.ts'))).toBe(normalize(expected));
  });

  test('no-op when no page() calls', () => {
    const source = 'export const x = 1;\n';
    expect(transformSource(source, 'plain.ts')).toBe(source);
  });
});
