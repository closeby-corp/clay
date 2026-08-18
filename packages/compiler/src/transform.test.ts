import { describe, expect, test } from 'bun:test';
import { mightNeedReactiveLet, transformReactiveLet } from './transform.ts';

describe('mightNeedReactiveLet', () => {
  test('true for pragma + let', () => {
    expect(mightNeedReactiveLet('// @clay-reactive\nlet x = 1;')).toBe(true);
  });
  test('true for ui.page', () => {
    expect(mightNeedReactiveLet('ui.page("/", () => { let n = 0; });')).toBe(true);
  });
  test('false without let', () => {
    expect(mightNeedReactiveLet('// @clay-reactive\nconst x = 1;')).toBe(false);
  });
});

describe('transformReactiveLet', () => {
  test('rewrites leading lets in ui.page callback', () => {
    const src = `import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  ui.label(\`Count: \${count}\`);
  ui.button('+', { onClick: () => { count++; } });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets).toEqual(['count']);
    expect(out.code).toContain('ui.state({ count: 0 })');
    expect(out.code).toContain('ui.auto(');
    expect(out.code).toMatch(/\.count\+\+/);
    expect(out.code).not.toMatch(/\blet count\b/);
  });

  test('multiple leading lets + file pragma', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
export function demo() {
  let count = 0;
  let name = "x";
  ui.label(name + String(count));
}
`;
    const out = transformReactiveLet(src, 'demo.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets.sort()).toEqual(['count', 'name']);
    expect(out.code).toContain('count: 0');
    expect(out.code).toContain('name: "x"');
  });

  test('"use reactive" directive opts in non-page functions', () => {
    const src = `import { ui } from '@close-by/clay';
function counter() {
  "use reactive";
  let n = 1;
  ui.label(String(n));
}
`;
    const out = transformReactiveLet(src, 'c.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets).toEqual(['n']);
    expect(out.code).not.toContain('"use reactive"');
  });

  test('does not transform without opt-in', () => {
    const src = `function helper() {
  let n = 0;
  return n + 1;
}
`;
    const out = transformReactiveLet(src, 'h.ts');
    expect(out.transformed).toBe(false);
    expect(out.code).toBe(src);
  });

  test('transforms let after other statements', () => {
    const src = `import { ui } from '@close-by/clay';
ui.page('/', () => {
  ui.label('hi');
  let count = 0;
  ui.label(String(count));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets).toEqual(['count']);
    expect(out.code).toContain('ui.state({ count: 0 })');
    expect(out.code).toContain('ui.auto(');
    expect(out.code).not.toMatch(/\blet count\b/);
  });

  test('transforms let inside nested block', () => {
    const src = `import { ui } from '@close-by/clay';
ui.page('/', () => {
  ui.label('hi');
  {
    let count = 0;
    ui.label(String(count));
  }
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets).toEqual(['count']);
    expect(out.code).toContain('ui.state({ count: 0 })');
    expect(out.code).toMatch(/\.count/);
    expect(out.code).not.toMatch(/\blet count\b/);
  });

  test('transforms nested ui callbacks inside page', () => {
    const src = `import { ui } from '@close-by/clay';
ui.page('/', () => {
  ui.column(() => {
    let n = 1;
    ui.label(String(n));
  });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets).toEqual(['n']);
    expect(out.code).toContain('ui.state({ n: 1 })');
  });

  test('accepts undefined / as / parenthesized initializers', () => {
    const src = `import { ui } from '@close-by/clay';
ui.page('/', () => {
  let a = undefined;
  let b = (0);
  let c = 1 as number;
  ui.label(String(a) + b + c);
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets.sort()).toEqual(['a', 'b', 'c']);
  });

  test('skips destructuring and complex initializers', () => {
    const src = `import { ui } from '@close-by/clay';
ui.page('/', () => {
  let { x } = obj;
  ui.label('a');
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(false);
  });

  test('skips duplicate let names across blocks', () => {
    const src = `import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  {
    let count = 1;
    ui.label(String(count));
  }
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(false);
  });

  test('injects state/auto import when ui is not imported', () => {
    const src = `page('/', () => {
  let count = 0;
  label(String(count));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code).toContain("from '@close-by/clay'");
    expect(out.code).toContain('state({ count: 0 })');
    expect(out.code).toContain('auto(');
  });

  test('assignment and += rewrite', () => {
    const src = `import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  ui.button('r', { onClick: () => { count = 0; count += 2; } });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code).toMatch(/\.count = 0/);
    expect(out.code).toMatch(/\.count \+= 2/);
  });
});
