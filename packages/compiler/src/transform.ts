import ts from 'typescript';

export type TransformReactiveLetOptions = {
  /** Prefer `ui.state` / `ui.auto` when `ui` is imported (default true). */
  preferUiNamespace?: boolean;
};

export type TransformReactiveLetResult = {
  code: string;
  transformed: boolean;
  /** Names of `let` bindings that were lifted into state. */
  lets: string[];
};

const FILE_PRAGMA_RE = /^\s*(?:\/\/\s*@badui-reactive\b|\/\*\s*@badui-reactive\b)/m;

function hasFilePragma(source: string): boolean {
  // Only look at the leading comment block (before first non-comment statement).
  const head = source.slice(0, 4000);
  const firstCode = head.search(/^\s*(?!\/\/|\/\*|\*)/m);
  const prefix = firstCode === -1 ? head : head.slice(0, Math.max(firstCode, 0) + 200);
  return FILE_PRAGMA_RE.test(prefix) || /^\s*\/\/\s*@badui-reactive\b/m.test(source.split('\n').slice(0, 30).join('\n'));
}

function isUseReactiveDirective(stmt: ts.Statement): boolean {
  if (!ts.isExpressionStatement(stmt)) return false;
  const expr = stmt.expression;
  return ts.isStringLiteral(expr) && expr.text === 'use reactive';
}

function isSimpleInitializer(expr: ts.Expression | undefined): boolean {
  if (!expr) return false;
  if (
    ts.isNumericLiteral(expr) ||
    ts.isStringLiteral(expr) ||
    ts.isNoSubstitutionTemplateLiteral(expr) ||
    expr.kind === ts.SyntaxKind.TrueKeyword ||
    expr.kind === ts.SyntaxKind.FalseKeyword ||
    expr.kind === ts.SyntaxKind.NullKeyword
  ) {
    return true;
  }
  if (ts.isPrefixUnaryExpression(expr) && ts.isNumericLiteral(expr.operand)) {
    return expr.operator === ts.SyntaxKind.MinusToken || expr.operator === ts.SyntaxKind.PlusToken;
  }
  if (ts.isArrayLiteralExpression(expr)) {
    return expr.elements.every(
      (el) =>
        ts.isSpreadElement(el) ? false : isSimpleInitializer(el as ts.Expression),
    );
  }
  if (ts.isObjectLiteralExpression(expr)) {
    return expr.properties.every((p) => {
      if (ts.isPropertyAssignment(p)) return isSimpleInitializer(p.initializer);
      if (ts.isShorthandPropertyAssignment(p)) return true;
      return false;
    });
  }
  return false;
}

function collectLeadingLets(
  statements: readonly ts.Statement[],
): { lets: Array<{ name: string; initializer: ts.Expression }>; restStart: number; hadDirective: boolean } {
  let i = 0;
  let hadDirective = false;
  if (statements[0] && isUseReactiveDirective(statements[0])) {
    hadDirective = true;
    i = 1;
  }

  const lets: Array<{ name: string; initializer: ts.Expression }> = [];
  while (i < statements.length) {
    const stmt = statements[i]!;
    if (!ts.isVariableStatement(stmt)) break;
    if (!(stmt.declarationList.flags & ts.NodeFlags.Let)) break;
    if (stmt.declarationList.declarations.length !== 1) break;
    const decl = stmt.declarationList.declarations[0]!;
    if (!ts.isIdentifier(decl.name) || !decl.initializer || !isSimpleInitializer(decl.initializer)) {
      break;
    }
    lets.push({ name: decl.name.text, initializer: decl.initializer });
    i++;
  }

  return { lets, restStart: i, hadDirective };
}

function isPageBuilderCallback(node: ts.ArrowFunction | ts.FunctionExpression): boolean {
  const parent = node.parent;
  if (!parent || !ts.isCallExpression(parent)) return false;
  // Callback is typically the 2nd arg: page(path, fn) / ui.page(path, fn)
  const args = parent.arguments;
  const idx = args.indexOf(node as unknown as ts.Expression);
  if (idx < 0) return false;

  const callee = parent.expression;
  if (ts.isIdentifier(callee) && callee.text === 'page') return true;
  if (
    ts.isPropertyAccessExpression(callee) &&
    callee.name.text === 'page' &&
    ts.isIdentifier(callee.expression)
  ) {
    return true;
  }
  return false;
}

function fileHasUiImport(sourceFile: ts.SourceFile): boolean {
  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt) || !stmt.importClause) continue;
    const clause = stmt.importClause;
    if (clause.name?.text === 'ui') return true;
    const bindings = clause.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const el of bindings.elements) {
        if ((el.propertyName ?? el.name).text === 'ui') return true;
      }
    }
    if (bindings && ts.isNamespaceImport(bindings) && bindings.name.text === 'ui') return true;
  }
  return false;
}

function shouldRewriteIdent(n: ts.Identifier, names: Set<string>): boolean {
  if (!names.has(n.text)) return false;
  const p = n.parent;
  if (!p) return true;
  if (ts.isPropertyAccessExpression(p) && p.name === n) return false;
  if (ts.isPropertyAssignment(p) && p.name === n) return false;
  if (ts.isBindingElement(p) && p.name === n) return false;
  if (ts.isImportSpecifier(p)) return false;
  if (ts.isParameter(p) && p.name === n) return false;
  if (ts.isFunctionDeclaration(p) && p.name === n) return false;
  if (ts.isClassDeclaration(p) && p.name === n) return false;
  if (ts.isMethodDeclaration(p) && p.name === n) return false;
  if (ts.isVariableDeclaration(p) && p.name === n) return false;
  return true;
}

function rewriteIdents(
  context: ts.TransformationContext,
  node: ts.Node,
  names: Set<string>,
  stateIdent: ts.Identifier,
): ts.Node {
  const { factory } = context;
  const visit = (n: ts.Node): ts.Node => {
    if (ts.isShorthandPropertyAssignment(n) && names.has(n.name.text)) {
      return factory.createPropertyAssignment(
        n.name,
        factory.createPropertyAccessExpression(stateIdent, n.name.text),
      );
    }
    if (ts.isIdentifier(n) && shouldRewriteIdent(n, names)) {
      return factory.createPropertyAccessExpression(stateIdent, n.text);
    }
    return ts.visitEachChild(n, visit, context);
  };
  return visit(node);
}

type TransformSite = {
  fn: ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration;
  lets: Array<{ name: string; initializer: ts.Expression }>;
  restStart: number;
  hadDirective: boolean;
};

function findSites(sourceFile: ts.SourceFile, filePragma: boolean): TransformSite[] {
  const sites: TransformSite[] = [];

  const consider = (fn: ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration) => {
    const body = fn.body;
    if (!body || !ts.isBlock(body)) return;
    const { lets, restStart, hadDirective } = collectLeadingLets(body.statements);
    if (lets.length === 0) return;
    const eligible =
      hadDirective || filePragma || (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)
        ? isPageBuilderCallback(fn)
        : false);
    if (!eligible) return;
    if (restStart >= body.statements.length) return; // nothing to wrap
    sites.push({ fn, lets, restStart, hadDirective });
  };

  const walk = (node: ts.Node) => {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)) {
      consider(node);
    }
    ts.forEachChild(node, walk);
  };
  walk(sourceFile);
  return sites;
}

/**
 * Rewrite tracked top-level `let` bindings into `ui.state` / `ui.auto` (or `state` / `auto`).
 *
 * **MVP subset**
 * - Opt-in via file pragma `// @badui-reactive`, block directive `"use reactive";`,
 *   or a `page` / `ui.page` callback.
 * - Only consecutive leading `let name = <simple>` in a function block.
 * - Simple initializers: literals, unary ±number, shallow array/object literals.
 * - Remaining statements are wrapped in `auto`; identifiers rewritten to state props.
 */
export function transformReactiveLet(
  source: string,
  fileName = 'input.ts',
  options: TransformReactiveLetOptions = {},
): TransformReactiveLetResult {
  const preferUi = options.preferUiNamespace !== false;
  const filePragma = hasFilePragma(source);
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('tsx') || fileName.endsWith('jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const sites = findSites(sourceFile, filePragma);
  if (sites.length === 0) {
    return { code: source, transformed: false, lets: [] };
  }

  const useUi = preferUi && fileHasUiImport(sourceFile);
  const allLets: string[] = [];
  let counter = 0;

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const { factory } = context;
    const siteSet = new Set(sites.map((s) => s.fn));

    const visit = (node: ts.Node): ts.Node => {
      if (
        (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)) &&
        siteSet.has(node)
      ) {
        const site = sites.find((s) => s.fn === node)!;
        const body = node.body;
        if (!body || !ts.isBlock(body)) return node;

        const stateName = factory.createIdentifier(`__badui_s${counter++}`);
        const names = new Set(site.lets.map((l) => l.name));
        allLets.push(...site.lets.map((l) => l.name));

        const props = site.lets.map((l) =>
          factory.createPropertyAssignment(l.name, l.initializer),
        );
        const stateCall = useUi
          ? factory.createCallExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('ui'), 'state'),
              undefined,
              [factory.createObjectLiteralExpression(props, false)],
            )
          : factory.createCallExpression(factory.createIdentifier('state'), undefined, [
              factory.createObjectLiteralExpression(props, false),
            ]);

        const stateDecl = factory.createVariableStatement(
          undefined,
          factory.createVariableDeclarationList(
            [factory.createVariableDeclaration(stateName, undefined, undefined, stateCall)],
            ts.NodeFlags.Const,
          ),
        );

        const rest = body.statements.slice(site.restStart);
        const rewrittenRest = rest.map(
          (stmt) => rewriteIdents(context, stmt, names, stateName) as ts.Statement,
        );

        const autoArg = factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createBlock(rewrittenRest, true),
        );

        const autoCall = useUi
          ? factory.createCallExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('ui'), 'auto'),
              undefined,
              [autoArg],
            )
          : factory.createCallExpression(factory.createIdentifier('auto'), undefined, [autoArg]);

        const autoStmt = factory.createExpressionStatement(autoCall);
        const newStatements: ts.Statement[] = [stateDecl, autoStmt];

        const newBody = factory.createBlock(newStatements, true);

        if (ts.isArrowFunction(node)) {
          return factory.updateArrowFunction(
            node,
            node.modifiers,
            node.typeParameters,
            node.parameters,
            node.type,
            node.equalsGreaterThanToken,
            newBody,
          );
        }
        if (ts.isFunctionExpression(node)) {
          return factory.updateFunctionExpression(
            node,
            node.modifiers,
            node.asteriskToken,
            node.name,
            node.typeParameters,
            node.parameters,
            node.type,
            newBody,
          );
        }
        return factory.updateFunctionDeclaration(
          node,
          node.modifiers,
          node.asteriskToken,
          node.name,
          node.typeParameters,
          node.parameters,
          node.type,
          newBody,
        );
      }
      return ts.visitEachChild(node, visit, context);
    };

    return (sf) => ts.visitNode(sf, visit) as ts.SourceFile;
  };

  const result = ts.transform(sourceFile, [transformer]);
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });
  let code = printer.printFile(result.transformed[0]!);
  result.dispose();

  if (!useUi) {
    // Ensure state/auto are available when not using ui.*
    const needsImport =
      !/\bimport\s*\{[^}]*\bstate\b/.test(source) || !/\bimport\s*\{[^}]*\bauto\b/.test(source);
    if (needsImport && !source.includes("from '@badui/ui'") && !source.includes('from "@badui/ui"')) {
      // If file already imports from @badui/ui or @badui/core, leave as-is (caller must export).
      // Inject a named import only when neither state nor auto appear as imports.
      const hasState = /\bimport\s*\{[^}]*\bstate\b/.test(source);
      const hasAuto = /\bimport\s*\{[^}]*\bauto\b/.test(source);
      if (!hasState || !hasAuto) {
        const names = [!hasState && 'state', !hasAuto && 'auto'].filter(Boolean).join(', ');
        code = `import { ${names} } from '@badui/ui';\n` + code;
      }
    }
  }

  return { code, transformed: true, lets: allLets };
}

/** True if the source looks like it might need a reactive-let pass (cheap prefilter). */
export function mightNeedReactiveLet(source: string): boolean {
  if (!/\blet\b/.test(source)) return false;
  return (
    hasFilePragma(source) ||
    /["']use reactive["']/.test(source) ||
    /\b(?:ui\.)?page\s*\(/.test(source)
  );
}
