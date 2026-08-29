import ts from 'typescript';

/**
 * Packages known to break when the reactive-let Bun `onLoad` plugin rewrites
 * the importing module (CJS named-export interop). Extend as we learn more.
 */
export const FRAGILE_CJS_PACKAGES: readonly string[] = [
  '@clickhouse/client',
];

const FRAGILE_PREFIXES = FRAGILE_CJS_PACKAGES.map((p) => `${p}/`);

function isFragileModule(spec: string): boolean {
  if (FRAGILE_CJS_PACKAGES.includes(spec)) return true;
  return FRAGILE_PREFIXES.some((prefix) => spec.startsWith(prefix));
}

/** Collect warnings for imports of {@link FRAGILE_CJS_PACKAGES} in a source file. */
export function collectFragileImportWarnings(sourceFile: ts.SourceFile): string[] {
  const found = new Set<string>();
  const warnings: string[] = [];

  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt) || !stmt.moduleSpecifier) continue;
    if (!ts.isStringLiteralLike(stmt.moduleSpecifier)) continue;
    const spec = stmt.moduleSpecifier.text;
    if (!isFragileModule(spec)) continue;
    if (found.has(spec)) continue;
    found.add(spec);
    warnings.push(
      `imports fragile CJS package "${spec}" — reactive-let rewrites can break named exports; prefer \`clay --no-reactive-let\` (default) or Clay HTTP helpers until interop is proven`,
    );
  }

  return warnings;
}
