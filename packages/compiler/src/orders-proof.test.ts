/**
 * Orders-shaped transform proof: multi-pane filter / list / detail must not
 * collapse into one function-wide `ui.auto`.
 */
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { transformReactiveLet } from './transform.ts';

/** Minimal master–detail matching the demo page’s reactive shape. */
const ORDERS_SHAPED = `// @clay-reactive
import { ui } from '@close-by/clay';

ui.page('/orders', () => {
  let filter = '';
  let selectedId = '';
  let rows = [
    { id: 'ord-1001', status: 'ok', city: 'Lisbon' },
    { id: 'ord-1002', status: 'warn', city: 'Porto' },
  ];

  ui.label('Orders');

  ui.row(() => {
    ui.input({
      value: filter,
      onInput: (v) => { filter = v; },
    });
    ui.label(\`Matching filter: \${filter}\`);
  });

  ui.resizable({ orientation: 'horizontal' }, (r) => {
    r.panel({ defaultSize: 40 }, () => {
      ui.column(() => {
        ui.label('Intake');
        for (const row of rows) {
          if (filter && !row.id.includes(filter)) continue;
          ui.button(row.id, {
            variant: row.id === selectedId ? 'secondary' : 'ghost',
            onClick: () => { selectedId = row.id; },
          });
        }
      });
    });
    r.panel({ defaultSize: 60 }, () => {
      ui.column(() => {
        const row = rows.find((x) => x.id === selectedId);
        if (!row) {
          ui.label('Select an order');
          return;
        }
        ui.label(row.id);
        ui.badge(row.status);
      });
    });
  });
});
`;

describe('Orders-shaped reactive-let proof', () => {
  test('transforms and keeps shell outside a mega-auto', () => {
    const out = transformReactiveLet(ORDERS_SHAPED, 'orders.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets.sort()).toEqual(['filter', 'rows', 'selectedId']);
    expect(out.code).toContain('ui.state({');
    expect(out.code).toContain('filter:');
    expect(out.code).toContain('selectedId:');
    expect(out.code).toContain('rows:');

    // Title shell stays as a plain label (not forced into the only auto).
    expect(out.code).toMatch(/ui\.label\('Orders'\)/);

    // Filter caption uses bindText, not a page-wide auto.
    expect(out.code).toContain('ui.label(() =>');

    // List + detail live in nested callbacks — each gets its own region(s).
    expect(out.code).toMatch(/r\.panel\([\s\S]*ui\.auto\(/);
    const autoCount = out.code.match(/ui\.auto\(/g)?.length ?? 0;
    expect(autoCount).toBeGreaterThanOrEqual(2);

    // Must not wrap the entire page body in a single auto after state.
    expect(out.code).not.toMatch(
      /ui\.state\(\{[\s\S]*?\}\);\s*ui\.auto\(\(\) => \{\s*ui\.label\('Orders'\)/,
    );
  });

  test('demo let page transforms to separate list/detail regions', () => {
    const path = join(
      import.meta.dir,
      '../../../apps/demo/src/examples/ReactiveLetOrdersLet.ts',
    );
    const src = readFileSync(path, 'utf8');
    expect(src.startsWith('// @clay-reactive')).toBe(true);

    const out = transformReactiveLet(src, 'ReactiveLetOrdersLet.ts');
    expect(out.transformed).toBe(true);
    expect(out.lets.sort()).toEqual(['filter', 'rows', 'selectedId']);
    expect(out.code).toContain("ui.label('Orders')");
    expect(out.code).toContain('ui.label(() =>');
    expect((out.code.match(/ui\.auto\(/g) ?? []).length).toBeGreaterThanOrEqual(2);

    // Detail: const row + if (!row) + Clear stay in one auto.
    expect(out.code).toMatch(
      /ui\.auto\(\(\) => \{\s*const row = __clay_s\d+\.rows\.find[\s\S]*?if\s*\(!row\)[\s\S]*Clear selection/,
    );
  });
});
