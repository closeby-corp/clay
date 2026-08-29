import { describe, expect, test } from 'bun:test';
import ts from 'typescript';
import { collectFragileImportWarnings } from './fragile-imports.ts';

function warningsFor(source: string): string[] {
  const sf = ts.createSourceFile('t.ts', source, ts.ScriptTarget.Latest, true);
  return collectFragileImportWarnings(sf);
}

describe('collectFragileImportWarnings', () => {
  test('warns on @clickhouse/client import', () => {
    const ws = warningsFor(`import { createClient } from '@clickhouse/client';`);
    expect(ws).toHaveLength(1);
    expect(ws[0]).toContain('@clickhouse/client');
    expect(ws[0]).toContain('reactive-let');
  });

  test('warns on subpath import', () => {
    const ws = warningsFor(`import x from '@clickhouse/client/dist/foo';`);
    expect(ws).toHaveLength(1);
    expect(ws[0]).toContain('@clickhouse/client');
  });

  test('ignores unrelated imports', () => {
    const ws = warningsFor(`import { ui } from '@close-by/clay';`);
    expect(ws).toHaveLength(0);
  });

  test('dedupes duplicate imports', () => {
    const ws = warningsFor(`
import { createClient } from '@clickhouse/client';
import type { ClickHouseClient } from '@clickhouse/client';
`);
    expect(ws).toHaveLength(1);
  });
});
