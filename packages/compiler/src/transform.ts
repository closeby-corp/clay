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

const FILE_PRAGMA_RE = /^\s*(?:\/\/\s*@clay-reactive\b|\/\*\s*@clay-reactive\b)/m;

function hasFilePragma(source: string): boolean {
  // Only look at the leading comment block (before first non-comment statement).
  const head = source.slice(0, 4000);
  const firstCode = head.search(/^\s*(?!\/\/|\/\*|\*)/m);
  const prefix = firstCode === -1 ? head : head.slice(0, Math.max(firstCode, 0) + 200);
  return FILE_PRAGMA_RE.test(prefix) || /^\s*\/\/\s*@clay-reactive\b/m.test(source.split('\n').slice(0, 30).join('\n'));
}

function isUseReactiveDirective(stmt: ts.Statement): boolean {
  if (!ts.isExpressionStatement(stmt)) return false;
  const expr = stmt.expression;
  return ts.isStringLiteral(expr) && expr.text === 'use reactive';
}

function isSimpleInitializer(expr: ts.Expression | undefined): boolean {
  if (!expr) return false;

  // Unwrap (x), x as T, x satisfies T
  if (ts.isParenthesizedExpression(expr)) return isSimpleInitializer(expr.expression);
  if (ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr)) {
    return isSimpleInitializer(expr.expression);
  }

  if (
    ts.isNumericLiteral(expr) ||
    ts.isBigIntLiteral(expr) ||
    ts.isStringLiteral(expr) ||
    ts.isNoSubstitutionTemplateLiteral(expr) ||
    expr.kind === ts.SyntaxKind.TrueKeyword ||
    expr.kind === ts.SyntaxKind.FalseKeyword ||
    expr.kind === ts.SyntaxKind.NullKeyword ||
    expr.kind === ts.SyntaxKind.UndefinedKeyword
  ) {
    return true;
  }
  if (ts.isIdentifier(expr) && expr.text === 'undefined') return true;

  if (ts.isPrefixUnaryExpression(expr)) {
    if (ts.isNumericLiteral(expr.operand) || ts.isBigIntLiteral(expr.operand)) {
      return (
        expr.operator === ts.SyntaxKind.MinusToken ||
        expr.operator === ts.SyntaxKind.PlusToken
      );
    }
    return false;
  }

  if (ts.isArrayLiteralExpression(expr)) {
    return expr.elements.every((el) =>
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

function isSimpleLetStatement(
  stmt: ts.Statement,
): { name: string; initializer: ts.Expression } | null {
  if (!ts.isVariableStatement(stmt)) return null;
  if (!(stmt.declarationList.flags & ts.NodeFlags.Let)) return null;
  if (stmt.declarationList.declarations.length !== 1) return null;
  const decl = stmt.declarationList.declarations[0]!;
  if (!ts.isIdentifier(decl.name) || !decl.initializer || !isSimpleInitializer(decl.initializer)) {
    return null;
  }
  return { name: decl.name.text, initializer: decl.initializer };
}

/**
 * Collect transformable `let`s anywhere in a function block (including nested
 * blocks), but not inside nested functions. Duplicate names abort collection.
 */
function collectLetsInFunctionBody(
  body: ts.Block,
): { lets: Array<{ name: string; initializer: ts.Expression }>; hadDirective: boolean } | null {
  let hadDirective = false;
  const lets: Array<{ name: string; initializer: ts.Expression }> = [];
  const names = new Set<string>();

  const considerStmt = (stmt: ts.Statement): boolean => {
    const simple = isSimpleLetStatement(stmt);
    if (!simple) return true;
    if (names.has(simple.name)) return false; // shadowing / duplicate → skip site
    names.add(simple.name);
    lets.push(simple);
    return true;
  };

  const walkBlock = (block: ts.Block, isFnBody: boolean): boolean => {
    let i = 0;
    if (isFnBody && block.statements[0] && isUseReactiveDirective(block.statements[0])) {
      hadDirective = true;
      i = 1;
    }
    for (; i < block.statements.length; i++) {
      const stmt = block.statements[i]!;
      if (!considerStmt(stmt)) return false;
      if (!walkNested(stmt)) return false;
    }
    return true;
  };

  const walkNested = (node: ts.Node): boolean => {
    // Do not enter nested function scopes — those are separate transform sites.
    if (
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isConstructorDeclaration(node)
    ) {
      return true;
    }
    if (ts.isBlock(node)) {
      return walkBlock(node, false);
    }
    if (ts.isIfStatement(node)) {
      if (ts.isBlock(node.thenStatement)) {
        if (!walkBlock(node.thenStatement, false)) return false;
      } else if (!considerStmt(node.thenStatement) || !walkNested(node.thenStatement)) {
        return false;
      }
      if (node.elseStatement) {
        if (ts.isBlock(node.elseStatement)) {
          if (!walkBlock(node.elseStatement, false)) return false;
        } else if (!considerStmt(node.elseStatement) || !walkNested(node.elseStatement)) {
          return false;
        }
      }
      return true;
    }
    if (
      ts.isForStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node)
    ) {
      // Skip loop-scoped lets (would re-init every iteration if hoisted).
      return true;
    }
    if (ts.isTryStatement(node)) {
      if (!walkBlock(node.tryBlock, false)) return false;
      if (node.catchClause && !walkBlock(node.catchClause.block, false)) return false;
      if (node.finallyBlock && !walkBlock(node.finallyBlock, false)) return false;
      return true;
    }
    if (ts.isSwitchStatement(node)) {
      for (const clause of node.caseBlock.clauses) {
        for (const stmt of clause.statements) {
          if (!considerStmt(stmt)) return false;
          if (!walkNested(stmt)) return false;
        }
      }
      return true;
    }

    let ok = true;
    ts.forEachChild(node, (child) => {
      if (!ok) return;
      if (!walkNested(child)) ok = false;
    });
    return ok;
  };

  if (!walkBlock(body, true)) return null;
  return { lets, hadDirective };
}

function stripLetsAndDirective(
  context: ts.TransformationContext,
  body: ts.Block,
  names: Set<string>,
): ts.Statement[] {
  const { factory } = context;

  const filterStatements = (statements: readonly ts.Statement[], stripDirective: boolean): ts.Statement[] => {
    const out: ts.Statement[] = [];
    let start = 0;
    if (stripDirective && statements[0] && isUseReactiveDirective(statements[0])) {
      start = 1;
    }
    for (let i = start; i < statements.length; i++) {
      const stmt = statements[i]!;
      const simple = isSimpleLetStatement(stmt);
      if (simple && names.has(simple.name)) continue;
      out.push(rewriteStatement(stmt));
    }
    return out;
  };

  const rewriteStatement = (stmt: ts.Statement): ts.Statement => {
    if (ts.isBlock(stmt)) {
      return factory.updateBlock(stmt, filterStatements(stmt.statements, false));
    }
    if (ts.isIfStatement(stmt)) {
      let thenStmt: ts.Statement;
      if (ts.isBlock(stmt.thenStatement)) {
        thenStmt = factory.updateBlock(
          stmt.thenStatement,
          filterStatements(stmt.thenStatement.statements, false),
        );
      } else {
        const thenLet = isSimpleLetStatement(stmt.thenStatement);
        thenStmt =
          thenLet && names.has(thenLet.name)
            ? factory.createBlock([], true)
            : rewriteStatement(stmt.thenStatement);
      }
      let elseStmt = stmt.elseStatement;
      if (elseStmt) {
        if (ts.isBlock(elseStmt)) {
          elseStmt = factory.updateBlock(elseStmt, filterStatements(elseStmt.statements, false));
        } else {
          const elseLet = isSimpleLetStatement(elseStmt);
          elseStmt =
            elseLet && names.has(elseLet.name)
              ? factory.createBlock([], true)
              : rewriteStatement(elseStmt);
        }
      }
      return factory.updateIfStatement(stmt, stmt.expression, thenStmt, elseStmt);
    }
    if (ts.isTryStatement(stmt)) {
      return factory.updateTryStatement(
        stmt,
        factory.updateBlock(stmt.tryBlock, filterStatements(stmt.tryBlock.statements, false)),
        stmt.catchClause
          ? factory.updateCatchClause(
              stmt.catchClause,
              stmt.catchClause.variableDeclaration,
              factory.updateBlock(
                stmt.catchClause.block,
                filterStatements(stmt.catchClause.block.statements, false),
              ),
            )
          : undefined,
        stmt.finallyBlock
          ? factory.updateBlock(
              stmt.finallyBlock,
              filterStatements(stmt.finallyBlock.statements, false),
            )
          : undefined,
      );
    }
    if (ts.isSwitchStatement(stmt)) {
      const clauses = stmt.caseBlock.clauses.map((clause) => {
        const stmts = clause.statements.filter((s) => {
          const simple = isSimpleLetStatement(s);
          return !(simple && names.has(simple.name));
        }).map(rewriteStatement);
        if (ts.isCaseClause(clause)) {
          return factory.updateCaseClause(clause, clause.expression, stmts);
        }
        return factory.updateDefaultClause(clause, stmts);
      });
      return factory.updateSwitchStatement(
        stmt,
        stmt.expression,
        factory.updateCaseBlock(stmt.caseBlock, clauses),
      );
    }
    // Leave loops / nested functions as-is (lets inside loops were not collected).
    return stmt;
  };

  return filterStatements(body.statements, true);
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
  hadDirective: boolean;
};

function findSites(sourceFile: ts.SourceFile, filePragma: boolean): TransformSite[] {
  const sites: TransformSite[] = [];
  /** Functions nested inside an already-eligible reactive site inherit eligibility. */
  const eligibleFns = new WeakSet<ts.Node>();

  const consider = (
    fn: ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration,
    nestedInEligible: boolean,
  ) => {
    const body = fn.body;
    if (!body || !ts.isBlock(body)) return;
    const collected = collectLetsInFunctionBody(body);
    if (!collected || collected.lets.length === 0) {
      if (
        nestedInEligible ||
        filePragma ||
        collected?.hadDirective ||
        ((ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) && isPageBuilderCallback(fn))
      ) {
        eligibleFns.add(fn);
      }
      return;
    }
    const eligible =
      collected.hadDirective ||
      filePragma ||
      nestedInEligible ||
      (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn) ? isPageBuilderCallback(fn) : false);
    if (!eligible) return;
    eligibleFns.add(fn);
    sites.push({ fn, lets: collected.lets, hadDirective: collected.hadDirective });
  };

  const walk = (node: ts.Node, nestedInEligible: boolean) => {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)) {
      consider(node, nestedInEligible);
      const childEligible = nestedInEligible || eligibleFns.has(node);
      ts.forEachChild(node, (child) => walk(child, childEligible));
      return;
    }
    ts.forEachChild(node, (child) => walk(child, nestedInEligible));
  };
  walk(sourceFile, false);
  return sites;
}

/**
 * Rewrite tracked `let` bindings into `ui.state` / `ui.auto` (or `state` / `auto`).
 *
 * Opt-in via file pragma `// @clay-reactive`, block directive `"use reactive";`,
 * a `page` / `ui.page` callback, or nesting inside an already-eligible function.
 *
 * Lifts simple `let`s anywhere in the function body (including nested blocks,
 * but not loops or nested function scopes). Remaining statements are wrapped in
 * `auto`; identifiers rewritten to state props.
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
      // Transform nested sites first so inner functions keep stable node identity
      // long enough for siteSet lookup, then rewrite the outer body around them.
      const isSite =
        (ts.isArrowFunction(node) ||
          ts.isFunctionExpression(node) ||
          ts.isFunctionDeclaration(node)) &&
        siteSet.has(node);
      const visited = ts.visitEachChild(node, visit, context);
      if (!isSite) return visited;

      const site = sites.find((s) => s.fn === node)!;
      const fn = visited as ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration;
      const body = fn.body;
      if (!body || !ts.isBlock(body)) return visited;

      const stateName = factory.createIdentifier(`__clay_s${counter++}`);
      const names = new Set(site.lets.map((l) => l.name));
      allLets.push(...site.lets.map((l) => l.name));

      // Prefer initializers from the visited tree when names still resolve.
      const initByName = new Map<string, ts.Expression>();
      const collectInits = (block: ts.Block) => {
        for (const stmt of block.statements) {
          const simple = isSimpleLetStatement(stmt);
          if (simple && names.has(simple.name)) initByName.set(simple.name, simple.initializer);
        }
      };
      collectInits(body);

      const props = site.lets.map((l) =>
        factory.createPropertyAssignment(l.name, initByName.get(l.name) ?? l.initializer),
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

      const stripped = stripLetsAndDirective(context, body, names);
      if (stripped.length === 0) {
        return visited;
      }

      const rewrittenRest = stripped.map(
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
      const newBody = factory.createBlock([stateDecl, autoStmt], true);

      if (ts.isArrowFunction(fn)) {
        return factory.updateArrowFunction(
          fn,
          fn.modifiers,
          fn.typeParameters,
          fn.parameters,
          fn.type,
          fn.equalsGreaterThanToken,
          newBody,
        );
      }
      if (ts.isFunctionExpression(fn)) {
        return factory.updateFunctionExpression(
          fn,
          fn.modifiers,
          fn.asteriskToken,
          fn.name,
          fn.typeParameters,
          fn.parameters,
          fn.type,
          newBody,
        );
      }
      return factory.updateFunctionDeclaration(
        fn,
        fn.modifiers,
        fn.asteriskToken,
        fn.name,
        fn.typeParameters,
        fn.parameters,
        fn.type,
        newBody,
      );
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
    if (needsImport && !source.includes("from '@clay/ui'") && !source.includes('from "@clay/ui"')) {
      // If file already imports from @clay/ui or @clay/core, leave as-is (caller must export).
      // Inject a named import only when neither state nor auto appear as imports.
      const hasState = /\bimport\s*\{[^}]*\bstate\b/.test(source);
      const hasAuto = /\bimport\s*\{[^}]*\bauto\b/.test(source);
      if (!hasState || !hasAuto) {
        const names = [!hasState && 'state', !hasAuto && 'auto'].filter(Boolean).join(', ');
        code = `import { ${names} } from '@clay/ui';\n` + code;
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
