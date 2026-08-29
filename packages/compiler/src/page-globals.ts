import ts from 'typescript';

/** DOM / browser globals that must not appear in Clay page modules (server-side builders). */
export const FORBIDDEN_PAGE_GLOBALS: readonly string[] = [
  'window',
  'document',
  'navigator',
  'location',
  'localStorage',
  'sessionStorage',
  'history',
];

const FORBIDDEN = new Set(FORBIDDEN_PAGE_GLOBALS);

function isBindingIdentifier(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (!parent) return false;
  if (ts.isImportSpecifier(parent) || ts.isImportClause(parent) || ts.isNamespaceImport(parent)) {
    return true;
  }
  if (ts.isExportSpecifier(parent)) return true;
  if (ts.isVariableDeclaration(parent) && parent.name === node) return true;
  if (ts.isParameter(parent) && parent.name === node) return true;
  if (ts.isFunctionDeclaration(parent) && parent.name === node) return true;
  if (ts.isPropertyDeclaration(parent) && parent.name === node) return true;
  if (ts.isMethodDeclaration(parent) && parent.name === node) return true;
  if (ts.isPropertySignature(parent) && parent.name === node) return true;
  if (ts.isEnumMember(parent) && parent.name === node) return true;
  if (ts.isBindingElement(parent) && parent.name === node) return true;
  if (ts.isModuleDeclaration(parent) && parent.name === node) return true;
  if (ts.isTypeParameterDeclaration(parent) && parent.name === node) return true;
  return false;
}

function clayPageHint(name: string): string {
  switch (name) {
    case 'window':
    case 'location':
    case 'history':
      return 'use ui.getUrlHash / ui.setUrlHash / ui.navigate / ui.openExternal';
    case 'navigator':
      return 'use ui.clipboard';
    case 'document':
      return 'use ui.runJavaScript or Clay helpers';
    case 'localStorage':
    case 'sessionStorage':
      return 'use ui.storage.browser / ui.storage.client / ui.storage.tab';
    default:
      return 'see docs/browser-apis.md';
  }
}

/** True when the file looks like a Clay page module (heuristic). */
export function looksLikeClayPage(source: string): boolean {
  if (/\bui\.page\s*\(/.test(source)) return true;
  if (/from\s+['"]@close-by\/clay['"]/.test(source) && /\bpage\s*\(\s*['"]/.test(source)) {
    return true;
  }
  if (/from\s+['"]@close-by\/clay['"]/.test(source) && /\bexport\s+default\s+function/.test(source)) {
    return true;
  }
  if (/^\s*(?:\/\/\s*@clay-reactive\b|\/\*\s*@clay-reactive\b)/m.test(source.slice(0, 4000))) {
    return true;
  }
  return false;
}

/** Collect dev warnings for forbidden DOM global references in page code. */
export function collectPageGlobalWarnings(sourceFile: ts.SourceFile): string[] {
  const seen = new Set<string>();
  const warnings: string[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && FORBIDDEN.has(node.text) && !isBindingIdentifier(node)) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const key = `${node.text}:${line + 1}`;
      if (seen.has(key)) return;
      seen.add(key);
      warnings.push(
        `DOM global \`${node.text}\` at line ${line + 1} is unavailable in page code — ${clayPageHint(node.text)}`,
      );
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return warnings;
}

export type CheckClayPageResult = {
  warnings: string[];
  looksLikePage: boolean;
};

/** Static checks for Clay page modules (DOM globals). */
export function checkClayPageModule(source: string, fileName = 'page.ts'): CheckClayPageResult {
  if (!looksLikeClayPage(source)) {
    return { warnings: [], looksLikePage: false };
  }

  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('tsx') || fileName.endsWith('jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  return {
    warnings: collectPageGlobalWarnings(sourceFile),
    looksLikePage: true,
  };
}
