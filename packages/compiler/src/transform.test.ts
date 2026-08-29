import { describe, expect, test } from 'bun:test';
import { mightNeedReactiveLet, transformReactiveLet } from './transform.ts';

describe('mightNeedReactiveLet', () => {
  test('true for pragma + let', () => {
    expect(mightNeedReactiveLet('// @clay-reactive\nlet x = 1;')).toBe(true);
  });
  test('true for use reactive + let', () => {
    expect(mightNeedReactiveLet('"use reactive";\nlet n = 0;')).toBe(true);
  });
  test('false for ui.page without pragma', () => {
    expect(mightNeedReactiveLet('ui.page("/", () => { let n = 0; });')).toBe(false);
  });
  test('false without let', () => {
    expect(mightNeedReactiveLet('// @clay-reactive\nconst x = 1;')).toBe(false);
  });
});

describe('transformReactiveLet', () => {
  test('does not transform ui.page without opt-in', () => {
    const src = `import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  ui.label(\`Count: \${count}\`);
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(false);
    expect(out.code).toBe(src);
  });

  test('rewrites leading lets with bindText for labels', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
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
    expect(out.code).toContain('ui.label(() =>');
    expect(out.code).not.toContain('ui.auto(');
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
    expect(out.code).toContain('ui.label(() =>');
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
    expect(out.code).toContain('ui.label(() =>');
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
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
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
    expect(out.code).toContain('ui.label(() => String(');
    expect(out.code).not.toMatch(/\blet count\b/);
  });

  test('transforms let inside nested block', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
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

  test('transforms nested ui callbacks inside opted-in page', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
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
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
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

  test('accepts binary / template / unary initializers', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let doubled = 10 * 2;
  let title = \`n=\${10}\`;
  let flag = !false;
  ui.label(title + String(doubled) + flag);
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets.sort()).toEqual(['doubled', 'flag', 'title']);
  });

  test('skips lets whose initializer references a sibling let', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let base = 10;
  let doubled = base * 2;
  ui.label(String(doubled));
});
`;
    expect(transformReactiveLet(src, 'page.ts').transformed).toBe(false);
  });

  test('skips call / destructuring initializers', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let x = load();
  ui.label(String(x));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(false);

    const dest = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let { x } = obj;
  ui.label('a');
});
`;
    expect(transformReactiveLet(dest, 'page.ts').transformed).toBe(false);
  });

  test('skips duplicate let names across blocks', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
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

  test('injects state import when ui is not imported', () => {
    const src = `// @clay-reactive
page('/', () => {
  let count = 0;
  label(String(count));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code).toContain("from '@close-by/clay'");
    expect(out.code).toContain('state({ count: 0 })');
    expect(out.code).toContain('label(() =>');
    expect(out.code).toMatch(/import \{ state \}/);
  });

  test('assignment and += rewrite', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  ui.button('r', { onClick: () => { count = 0; count += 2; } });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code).toMatch(/\.count = 0/);
    expect(out.code).toMatch(/\.count \+= 2/);
    expect(out.code).not.toContain('ui.auto(');
  });

  test('implicit regions: inert shell + bindText label', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  ui.label('shell');
  let count = 0;
  ui.label(\`Count: \${count}\`);
  ui.button('+', { onClick: () => { count++; } });
  ui.label('footer');
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code).toContain('ui.state({ count: 0 })');
    expect(out.code).not.toContain('ui.auto(');
    expect(out.code).toContain('ui.label(() =>');
    expect(out.code).toContain("ui.label('shell')");
    expect(out.code).toContain("ui.label('footer')");
  });

  test('implicit regions: nested column gets bindText', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  ui.row(() => {
    ui.label('aside');
    ui.column(() => {
      ui.label(String(count));
    });
  });
  ui.button('+', { onClick: () => { count++; } });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code).not.toContain('ui.auto(');
    expect(out.code).toMatch(/ui\.column\(\(\) => \{\s*ui\.label\(\(\) =>/);
    expect(out.code).toContain("ui.label('aside')");
  });

  test('dep-isolated: disjoint label reads use bindText not shared auto', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let a = 1;
  let b = 2;
  ui.label(String(a));
  ui.label(String(b));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code).not.toContain('ui.auto(');
    expect(out.code.match(/ui\.label\(\(\) =>/g)?.length).toBe(2);
  });

  test('dep-isolated: non-label reads with disjoint deps get separate autos', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let a = 1;
  let b = 2;
  ui.badge({ text: String(a) });
  ui.badge({ text: String(b) });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code.match(/ui\.auto\(/g)?.length).toBe(2);
  });

  test('dep-isolated: overlapping deps share one auto', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let a = 1;
  let b = 2;
  ui.badge({ text: String(a) });
  ui.badge({ text: String(a) + String(b) });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code.match(/ui\.auto\(/g)?.length).toBe(1);
  });

  test('glues locals: const row + if (!row) stay in one auto', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let selectedId = '';
  let rows = [{ id: 'a' }];
  const row = rows.find((x) => x.id === selectedId);
  if (!row) {
    ui.label('none');
    return;
  }
  ui.label(row.id);
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code.match(/ui\.auto\(/g)?.length).toBe(1);
    expect(out.code).toMatch(/ui\.auto\(\(\) => \{\s*const row =[\s\S]*if\s*\(!row\)[\s\S]*ui\.label\(row\.id\)/);
  });
});
