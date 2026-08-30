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

  test('multiple leading lets + file pragma on ui.page', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  let name = "x";
  ui.label(name + String(count));
});
`;
    const out = transformReactiveLet(src, 'demo.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets.sort()).toEqual(['count', 'name']);
    expect(out.code).toContain('count: 0');
    expect(out.code).toContain('name: "x"');
    expect(out.code).toContain('ui.label(() =>');
  });

  test('file pragma does not transform arbitrary module-level exports', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
export function demo() {
  let count = 0;
  ui.label(String(count));
}
`;
    const out = transformReactiveLet(src, 'demo.ts');
    expect(out.transformed).toBe(false);
    expect(out.code).toBe(src);
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

  test('does not lift lets in nested helpers under file pragma', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let units = [{ id: 'a' }];
  function visibleUnits() {
    let list = units;
    return list;
  }
  ui.label(String(units.length));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets).toEqual(['units']);
    expect(out.code).toContain('ui.state({ units:');
    expect(out.code).toMatch(/\blet list = /);
    expect(out.code).not.toContain('list:');
  });

  test('nested callback lets need their own "use reactive"', () => {
    const plain = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  ui.column(() => {
    let n = 1;
    ui.label(String(n));
  });
});
`;
    expect(transformReactiveLet(plain, 'page.ts').transformed).toBe(false);

    const opted = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  ui.column(() => {
    "use reactive";
    let n = 1;
    ui.label(String(n));
  });
});
`;
    const out = transformReactiveLet(opted, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets).toEqual(['n']);
    expect(out.code).toContain('ui.state({ n: 1 })');
  });

  test('does not rewrite idents inside type aliases', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let loading = false;
  type DetailState = {
    loading: boolean;
    error: string | null;
  };
  const detail: DetailState = { loading: false, error: null };
  ui.label(String(loading));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets.sort()).toEqual(['detail', 'loading']);
    expect(out.code).toContain('loading: boolean');
    expect(out.code).not.toMatch(/__clay_s\d+\.loading:\s*boolean/);
    expect(out.code).toContain('ui.label(() =>');
  });

  test('warns when bare builder call reads lifted state', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  function renderFeed() {
    ui.label(String(count));
  }
  renderFeed();
  ui.button('+', { onClick: () => { count++; } });
});
`;
    const out = transformReactiveLet(src, 'page.ts', { autoWrapBuilders: false });
    expect(out.transformed).toBe(true);
    expect(out.warnings.some((w) => w.includes('renderFeed()'))).toBe(true);
  });

  test('no warn when builder call is inside ui.auto', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  function renderFeed() {
    ui.label(String(count));
  }
  ui.auto(() => {
    renderFeed();
  });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.warnings).toEqual([]);
  });

  test('transforms nested ui callbacks inside opted-in page', () => {
    // legacy name — nested lets require their own directive (see test above)
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  ui.column(() => {
    "use reactive";
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

  test('skips await', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let x = await load();
  ui.label(String(x));
});
`;
    expect(transformReactiveLet(src, 'page.ts').transformed).toBe(false);
  });

  test('lifts nested object destructuring', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let { a: { b } } = { a: { b: 1 } };
  ui.label(String(b));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets).toEqual(['b']);
    expect(out.code).toContain('b: 1');
  });

  test('lifts loop-scoped mutable bindings via keyed state', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let rows = [{ id: 'a' }, { id: 'b' }];
  for (const row of rows) {
    let open = false;
    ui.button(row.id, {
      onClick: () => { open = !open; },
    });
    if (open) ui.label('open');
  }
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets.sort()).toEqual(['open', 'rows'].sort());
    expect(out.code).toContain('__clay_l0_open');
    expect(out.code).toContain('row.id');
    expect(out.code).toMatch(/__clay_lk_/);
  });

  test('lifts named bindings from rest destructuring', () => {
    const obj = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let { x, ...rest } = { x: 1, y: 2 };
  ui.label(String(x) + String(rest.y));
});
`;
    const outObj = transformReactiveLet(obj, 'page.ts');
    expect(outObj.transformed).toBe(true);
    expect(outObj.lets).toEqual(['x']);
    expect(outObj.code).toContain('x: 1');
    expect(outObj.code).toMatch(/const\s*\{\s*\.\.\.rest\s*\}/);

    const arr = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let [a, ...rest] = [1, 2, 3];
  ui.label(String(a) + String(rest.length));
});
`;
    const outArr = transformReactiveLet(arr, 'page.ts');
    expect(outArr.transformed).toBe(true);
    expect(outArr.lets).toEqual(['a']);
    expect(outArr.code).toContain('a: 1');
    expect(outArr.code).toMatch(/const\s*\[\s*,\s*\.\.\.rest\s*\]/);
  });

  test('lifts destructuring with defaults', () => {
    const obj = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let { a = 1, b = 2 } = {};
  ui.label(String(a) + String(b));
});
`;
    const outObj = transformReactiveLet(obj, 'page.ts');
    expect(outObj.transformed).toBe(true);
    expect(outObj.lets.sort()).toEqual(['a', 'b']);
    expect(outObj.code).toContain('a: 1');
    expect(outObj.code).toContain('b: 2');

    const arr = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let [x = 10] = [];
  ui.label(String(x));
});
`;
    const outArr = transformReactiveLet(arr, 'page.ts');
    expect(outArr.transformed).toBe(true);
    expect(outArr.lets).toEqual(['x']);
    expect(outArr.code).toContain('x: 10');
  });

  test('warns when local binding shadows lifted state', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let detail = false;
  const detail = rows.find((r) => r.id === id);
  ui.label(String(detail));
});
`;
    const out = transformReactiveLet(src, 'page.ts', {
      autoWrapBuilders: false,
      renameShadowedLocals: false,
    });
    expect(out.transformed).toBe(true);
    expect(out.warnings.some((w) => w.includes("shadows lifted state"))).toBe(true);
  });

  test('renames shadowing locals by default', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let detail = false;
  const detail = rows.find((r) => r.id === id);
  ui.label(String(detail));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.warnings.some((w) => w.includes("shadows lifted state") && w.includes('renamed to'))).toBe(true);
    expect(out.code).toMatch(/__clay_local_detail_/);
    expect(out.code).toContain('ui.label(String(__clay_local_detail_');
    expect(out.code).not.toContain('ui.state({ detail: false }).detail');
  });

  test('hard-fails when shadowing initializer reads the lifted name', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let detail = null as { id: string } | null;
  const detail = rows.find((r) => r.id === detail?.id);
  ui.label(String(detail));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(false);
    expect(out.errors?.some((e) => e.includes("initializer reads 'detail'"))).toBe(true);
  });

  test('hard-fails on const detail = detail', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let detail = 1;
  const detail = detail;
  ui.label(String(detail));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(false);
    expect(out.errors?.length).toBeGreaterThan(0);
  });

  test('lifts simple object / array destructuring', () => {
    const obj = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let { a, b } = { a: 1, b: 2 };
  ui.label(String(a) + String(b));
});
`;
    const outObj = transformReactiveLet(obj, 'page.ts');
    expect(outObj.transformed).toBe(true);
    expect(outObj.lets.sort()).toEqual(['a', 'b']);
    expect(outObj.code).toContain('a: 1');
    expect(outObj.code).toContain('b: 2');

    const arr = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let [x, y] = [10, 20];
  ui.label(String(x) + String(y));
});
`;
    const outArr = transformReactiveLet(arr, 'page.ts');
    expect(outArr.transformed).toBe(true);
    expect(outArr.lets.sort()).toEqual(['x', 'y']);
    expect(outArr.code).toContain('x: 10');
    expect(outArr.code).toContain('y: 20');
  });

  test('lifts const bindings like let', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  const count = 0;
  ui.label(String(count));
  ui.button('+', { onClick: () => { count++; } });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets).toEqual(['count']);
    expect(out.code).toContain('ui.state({ count: 0 })');
    expect(out.code).toContain('ui.label(() =>');
    expect(out.code).toMatch(/\.count\+\+/);
    expect(out.code).not.toMatch(/\bconst count\b/);
  });

  test('lifts call / new initializers as one-shot state seeds', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let clock = Date.now();
  let rangeFrom = defaultRangeFrom();
  let ids = new Map();
  ui.label(String(clock) + rangeFrom + String(ids.size));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets.sort()).toEqual(['clock', 'ids', 'rangeFrom']);
    expect(out.code).toContain('Date.now()');
    expect(out.code).toContain('defaultRangeFrom()');
    expect(out.code).toContain('new Map()');
    expect(out.code).toMatch(/ui\.state\(\{[\s\S]*clock:\s*Date\.now\(\)/);
  });

  test('does not inject ui.auto inside filter callbacks that read lifted state', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let feedFilter = 'all';
  let units = [{ id: 'a', ok: true }, { id: 'b', ok: false }];
  function visibleUnits() {
    return units.filter((u) => {
      if (feedFilter === 'issues' && !u.ok) return false;
      return true;
    });
  }
  ui.auto(() => {
    for (const u of visibleUnits()) {
      ui.label(u.id);
    }
  });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    const filterBody = out.code.match(/\.filter\(\(u\) => \{([\s\S]*?)\}\)/)?.[1] ?? '';
    expect(filterBody).not.toContain('ui.auto');
    expect(out.code).toMatch(/__clay_s\d+\.feedFilter === 'issues'/);
  });

  test('does not inject ui.auto inside timer or event handler callbacks', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  const poll = ui.timer(5, () => {
    count++;
  });
  ui.button('+', {
    onClick: () => {
      if (count > 0) count++;
    },
  });
  ui.label(() => String(count));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code).not.toMatch(/ui\.timer\([\s\S]*ui\.auto\(/);
    expect(out.code).not.toMatch(/onClick:[\s\S]*ui\.auto\(/);
  });

  test('warns when builder is called inside widget callback without ui.auto', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  function renderHeader() {
    ui.label(String(count));
  }
  ui.row(() => {
    renderHeader();
  });
});
`;
    const out = transformReactiveLet(src, 'page.ts', { autoWrapBuilders: false });
    expect(out.transformed).toBe(true);
    expect(out.warnings.some((w) => w.includes('widget callback without ui.auto'))).toBe(true);
  });

  test('auto-wraps builder calls inside widget callbacks', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  function renderHeader() {
    ui.label(String(count));
  }
  ui.row(() => {
    renderHeader();
  });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.warnings).toEqual([]);
    expect(out.code).toMatch(/ui\.row\([\s\S]*ui\.auto\(\(\) => \{\s*renderHeader\(\);/);
  });

  test('inline widget callback reads get bindText or auto', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let autoRefresh = false;
  let lastUpdated = null as string | null;
  ui.row({ gap: 2 }, () => {
    ui.icon('clock', { className: autoRefresh ? 'animate-pulse' : 'opacity-40' });
    ui.label(lastUpdated ? \`Updated \${lastUpdated}\` : 'Loading…');
  });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code).toContain('ui.label(() =>');
    expect(out.code).toMatch(/ui\.auto\(\(\) => \{\s*ui\.icon\(/);
  });

  test('does not warn when builder is only called from event handlers inside widgets', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  function bump() {
    count++;
  }
  ui.row(() => {
    ui.button('y', { onClick: () => { bump(); } });
  });
});
`;
    const out = transformReactiveLet(src, 'page.ts', { autoWrapBuilders: false });
    expect(out.transformed).toBe(true);
    expect(out.warnings.some((w) => w.includes('bump()'))).toBe(false);
  });

  test('auto-wraps bare builder calls that read lifted state', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  function renderFeed() {
    ui.label(String(count));
  }
  renderFeed();
  ui.button('+', { onClick: () => { count++; } });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.warnings).toEqual([]);
    expect(out.code).toMatch(/ui\.auto\(\(\) => \{\s*renderFeed\(\);/);
  });

  test('warns instead of auto-wrap when autoWrapBuilders is false', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  function renderFeed() {
    ui.label(String(count));
  }
  renderFeed();
});
`;
    const out = transformReactiveLet(src, 'page.ts', { autoWrapBuilders: false });
    expect(out.transformed).toBe(true);
    expect(out.warnings.some((w) => w.includes('renderFeed()'))).toBe(true);
    expect(out.code).not.toMatch(/ui\.auto\(\(\) => \{\s*renderFeed\(\);/);
  });

  test('duplicate let names across blocks: lift outer, rename inner shadow', () => {
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
    expect(out.transformed).toBe(true);
    expect(out.lets).toEqual(['count']);
    expect(out.code).toContain('ui.state({ count: 0 })');
    expect(out.code).toMatch(/__clay_local_count_/);
    expect(out.warnings.some((w) => w.includes('shadows lifted state') && w.includes('renamed'))).toBe(
      true,
    );
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

  test('dep-isolated: non-label reads with disjoint deps get bindText on badge', () => {
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
    expect(out.code.match(/ui\.auto\(/g)?.length ?? 0).toBe(0);
    expect(out.code.match(/text: \(\) =>/g)?.length).toBe(2);
  });

  test('bindText on positional badge and button', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let n = 1;
  ui.badge(String(n));
  ui.button(String(n), { onClick: () => { n++; } });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code).toContain('ui.badge(() => String(__clay_s0.n))');
    expect(out.code).toContain('ui.button(() => String(__clay_s0.n)');
    expect(out.code.match(/ui\.auto\(/g)?.length ?? 0).toBe(0);
  });

  test('bindText on iconText', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let n = 1;
  ui.iconText(String(n), { icon: 'hash' });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code).toContain("ui.iconText(() => String(__clay_s0.n), { icon: 'hash' })");
    expect(out.code.match(/ui\.auto\(/g)?.length ?? 0).toBe(0);
  });

  test('dep-isolated: overlapping deps share one bindText on badge', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let a = 1;
  let b = 2;
  ui.badge({ text: String(a) + String(b) });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code.match(/ui\.auto\(/g)?.length ?? 0).toBe(0);
    expect(out.code).toMatch(/text: \(\) => String\(__clay_s0\.a\) \+ String\(__clay_s0\.b\)/);
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

  test('warns when transform rewrites a file importing fragile CJS', () => {
    const src = `// @clay-reactive
import { createClient } from '@clickhouse/client';
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let n = 0;
  ui.label(String(n));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.warnings.some((w) => w.includes('@clickhouse/client'))).toBe(true);
  });

  test('file pragma does not transform module-level helpers', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';

function mergeUnits(a: number[], b: number[]) {
  return [...a, ...b];
}

ui.page('/', () => {
  'use reactive';
  let units: number[] = [];
  units = mergeUnits(units, [1]);
  ui.label(String(units.length));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.code).toMatch(
      /function mergeUnits\(a: number\[\], b: number\[\]\) \{\s*return \[\.\.\.a, \.\.\.b\];\s*\}/,
    );
    expect(out.code).toMatch(/__clay_s0\.units = mergeUnits\(__clay_s0\.units, \[1\]\)/);
  });

  test('file pragma still transforms ui.page callback without block directive', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  ui.label(String(count));
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets).toEqual(['count']);
  });

  test('auto-wraps composer builders inside resizable panel callbacks', () => {
    const src = `// @clay-reactive
import { ui } from '@close-by/clay';
ui.page('/', () => {
  let count = 0;
  function renderFeedList() {
    ui.label(String(count));
  }
  function renderFeedInScrollArea(className: string) {
    renderFeedList();
  }
  ui.resizable({}, (r) => {
    r.panel({ defaultSize: 50 }, () => {
      renderFeedInScrollArea('h-full');
    });
  });
});
`;
    const out = transformReactiveLet(src, 'page.ts');
    expect(out.transformed).toBe(true);
    expect(out.warnings).toEqual([]);
    expect(out.code).toMatch(
      /r\.panel\([\s\S]*ui\.auto\(\(\) => \{\s*renderFeedInScrollArea\('h-full'\);/,
    );
  });
});
