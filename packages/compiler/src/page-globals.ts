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

/** Property / member name position — `row.history`, `{ history: … }`, not a global read. */
function isPropertyNameIdentifier(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (!parent) return false;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return true;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return true;
  if (ts.isMethodDeclaration(parent) && parent.name === node) return true;
  if (ts.isPropertySignature(parent) && parent.name === node) return true;
  if (ts.isBindingElement(parent) && parent.propertyName === node) return true;
  if (ts.isShorthandPropertyAssignment(parent)) return false;
  return false;
}

function collectBindingNames(name: ts.BindingName, out: string[]): void {
  if (ts.isIdentifier(name)) {
    out.push(name.text);
    return;
  }
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    for (const el of name.elements) {
      if (ts.isOmittedExpression(el)) continue;
      collectBindingNames(el.name, out);
    }
  }
}

function addBindingsFromStatement(stmt: ts.Statement, scope: Set<string>): void {
  if (!ts.isVariableStatement(stmt)) return;
  for (const decl of stmt.declarationList.declarations) {
    const names: string[] = [];
    collectBindingNames(decl.name, names);
    for (const n of names) scope.add(n);
  }
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

function isForbiddenGlobalUse(node: ts.Identifier, scope: Set<string>): boolean {
  if (!FORBIDDEN.has(node.text)) return false;
  if (isBindingIdentifier(node)) return false;
  if (isPropertyNameIdentifier(node)) return false;
  if (scope.has(node.text)) return false;
  return true;
}

function visitBlockStatements(
  statements: readonly ts.Statement[],
  scope: Set<string>,
  sourceFile: ts.SourceFile,
  seen: Set<string>,
  warnings: string[],
): void {
  const blockScope = new Set(scope);
  for (const stmt of statements) {
    visitNode(stmt, blockScope, sourceFile, seen, warnings);
    addBindingsFromStatement(stmt, blockScope);
  }
}

function visitNode(
  node: ts.Node,
  scope: Set<string>,
  sourceFile: ts.SourceFile,
  seen: Set<string>,
  warnings: string[],
): void {
  if (ts.isIdentifier(node) && isForbiddenGlobalUse(node, scope)) {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const key = `${node.text}:${line + 1}`;
    if (!seen.has(key)) {
      seen.add(key);
      warnings.push(
        `DOM global \`${node.text}\` at line ${line + 1} is unavailable in page code — ${clayPageHint(node.text)}`,
      );
    }
    return;
  }

  if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    const fnScope = new Set(scope);
    for (const param of node.parameters ?? []) {
      const names: string[] = [];
      collectBindingNames(param.name, names);
      for (const n of names) fnScope.add(n);
    }
    const body = node.body;
    if (body && ts.isBlock(body)) {
      visitBlockStatements(body.statements, fnScope, sourceFile, seen, warnings);
    } else if (body) {
      visitNode(body, fnScope, sourceFile, seen, warnings);
    }
    return;
  }

  if (ts.isBlock(node)) {
    visitBlockStatements(node.statements, scope, sourceFile, seen, warnings);
    return;
  }

  ts.forEachChild(node, (child) => visitNode(child, scope, sourceFile, seen, warnings));
}

/** Collect dev warnings for forbidden DOM global references in page code. */
export function collectPageGlobalWarnings(sourceFile: ts.SourceFile): string[] {
  const seen = new Set<string>();
  const warnings: string[] = [];
  visitBlockStatements(sourceFile.statements, new Set(), sourceFile, seen, warnings);
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
