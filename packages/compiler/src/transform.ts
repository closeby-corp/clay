import ts from 'typescript';

export type TransformReactiveLetOptions = {
  /** Prefer `ui.state` / `ui.auto` when `ui` is imported (default true). */
  preferUiNamespace?: boolean;
  /**
   * Wrap bare local builder calls that read lifted state in `ui.auto`
   * (default `true`). When `false`, only emit warnings.
   */
  autoWrapBuilders?: boolean;
};

export type TransformReactiveLetResult = {
  code: string;
  transformed: boolean;
  /** Names of `let` bindings that were lifted into state. */
  lets: string[];
  /**
   * Non-fatal diagnostics (e.g. bare builder calls that read lifted state
   * without `ui.auto`). Empty when transformed is false.
   */
  warnings: string[];
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

function isSimpleCallee(expr: ts.Expression): boolean {
  if (ts.isParenthesizedExpression(expr)) return isSimpleCallee(expr.expression);
  if (ts.isIdentifier(expr)) return true;
  if (ts.isPropertyAccessExpression(expr)) return isSimpleCallee(expr.expression);
  if (ts.isElementAccessExpression(expr)) {
    return (
      isSimpleCallee(expr.expression) &&
      !!expr.argumentExpression &&
      isSimpleInitializer(expr.argumentExpression)
    );
  }
  return false;
}

function isSimpleInitializer(expr: ts.Expression | undefined): boolean {
  if (!expr) return false;

  // Unwrap (x), x as T, x satisfies T
  if (ts.isParenthesizedExpression(expr)) return isSimpleInitializer(expr.expression);
  if (ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr)) {
    return isSimpleInitializer(expr.expression);
  }

  // Async init is not a one-shot sync state seed.
  if (ts.isAwaitExpression(expr)) return false;

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
  if (ts.isIdentifier(expr)) return true; // includes `undefined` and outer bindings

  if (ts.isPrefixUnaryExpression(expr)) {
    const op = expr.operator;
    if (
      op === ts.SyntaxKind.MinusToken ||
      op === ts.SyntaxKind.PlusToken ||
      op === ts.SyntaxKind.ExclamationToken ||
      op === ts.SyntaxKind.TildeToken
    ) {
      return isSimpleInitializer(expr.operand);
    }
    return false;
  }

  if (ts.isBinaryExpression(expr)) {
    const op = expr.operatorToken.kind;
    if (op === ts.SyntaxKind.QuestionQuestionToken) {
      return isSimpleInitializer(expr.left) && isSimpleInitializer(expr.right);
    }
    // No `=` / compound assigns as initializers.
    if (
      op === ts.SyntaxKind.EqualsToken ||
      op === ts.SyntaxKind.PlusEqualsToken ||
      op === ts.SyntaxKind.MinusEqualsToken ||
      op === ts.SyntaxKind.AsteriskEqualsToken ||
      op === ts.SyntaxKind.SlashEqualsToken ||
      op === ts.SyntaxKind.PercentEqualsToken ||
      op === ts.SyntaxKind.BarEqualsToken ||
      op === ts.SyntaxKind.AmpersandEqualsToken ||
      op === ts.SyntaxKind.CaretEqualsToken ||
      op === ts.SyntaxKind.LessThanLessThanEqualsToken ||
      op === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken ||
      op === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken ||
      op === ts.SyntaxKind.AsteriskAsteriskEqualsToken ||
      op === ts.SyntaxKind.BarBarEqualsToken ||
      op === ts.SyntaxKind.AmpersandAmpersandEqualsToken ||
      op === ts.SyntaxKind.QuestionQuestionEqualsToken
    ) {
      return false;
    }
    return isSimpleInitializer(expr.left) && isSimpleInitializer(expr.right);
  }

  if (ts.isConditionalExpression(expr)) {
    return (
      isSimpleInitializer(expr.condition) &&
      isSimpleInitializer(expr.whenTrue) &&
      isSimpleInitializer(expr.whenFalse)
    );
  }

  if (ts.isTemplateExpression(expr)) {
    return expr.templateSpans.every((span) => isSimpleInitializer(span.expression));
  }

  if (ts.isPropertyAccessExpression(expr)) {
    return isSimpleInitializer(expr.expression);
  }

  if (ts.isElementAccessExpression(expr)) {
    return (
      isSimpleInitializer(expr.expression) &&
      !!expr.argumentExpression &&
      isSimpleInitializer(expr.argumentExpression)
    );
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

  // One-shot call / new (Date.now(), defaultRangeFrom(), new Map()).
  if (ts.isCallExpression(expr)) {
    return (
      isSimpleCallee(expr.expression) &&
      expr.arguments.every((arg) => !ts.isSpreadElement(arg) && isSimpleInitializer(arg))
    );
  }
  if (ts.isNewExpression(expr)) {
    const args = expr.arguments;
    if (!isSimpleCallee(expr.expression)) return false;
    if (!args || args.length === 0) return true;
    return args.every((arg) => !ts.isSpreadElement(arg) && isSimpleInitializer(arg));
  }

  return false;
}

/**
 * Expand a single `let`/`const` statement into one or more state bindings.
 * Supports identifier bindings and simple object/array destructuring (incl. rest).
 */
type LiftableBindings = {
  bindings: Array<{ name: string; initializer: ts.Expression }>;
  /** Pattern includes `...rest` — named bindings lift; rest stays as a local `const`. */
  hasRest: boolean;
};

function collectLiftableBindings(stmt: ts.Statement): LiftableBindings | null {
  if (!ts.isVariableStatement(stmt)) return null;
  const flags = stmt.declarationList.flags;
  const isLet = (flags & ts.NodeFlags.Let) !== 0;
  const isConst = (flags & ts.NodeFlags.Const) !== 0;
  if (!isLet && !isConst) return null;
  if (stmt.declarationList.declarations.length !== 1) return null;
  const decl = stmt.declarationList.declarations[0]!;
  if (!decl.initializer) return null;

  if (ts.isIdentifier(decl.name)) {
    if (!isSimpleInitializer(decl.initializer)) return null;
    return { bindings: [{ name: decl.name.text, initializer: decl.initializer }], hasRest: false };
  }

  if (ts.isObjectBindingPattern(decl.name)) {
    const expanded = expandObjectBinding(decl.name, decl.initializer);
    if (!expanded) return null;
    return expanded;
  }
  if (ts.isArrayBindingPattern(decl.name)) {
    const expanded = expandArrayBinding(decl.name, decl.initializer);
    if (!expanded) return null;
    return expanded;
  }
  return null;
}

function expandObjectBinding(
  pattern: ts.ObjectBindingPattern,
  init: ts.Expression,
): LiftableBindings | null {
  if (pattern.elements.length === 0) return null;
  const out: Array<{ name: string; initializer: ts.Expression }> = [];
  let hasRest = false;

  for (const el of pattern.elements) {
    if (!ts.isBindingElement(el)) return null;
    if (el.dotDotDotToken) {
      hasRest = true;
      continue;
    }
    if (!ts.isIdentifier(el.name)) return null; // no nested patterns yet

    const defaultInit =
      el.initializer && isSimpleInitializer(el.initializer) ? el.initializer : null;

    let propName: string;
    if (!el.propertyName) {
      propName = el.name.text;
    } else if (ts.isIdentifier(el.propertyName)) {
      propName = el.propertyName.text;
    } else if (ts.isStringLiteral(el.propertyName) || ts.isNumericLiteral(el.propertyName)) {
      propName = el.propertyName.text;
    } else {
      return null;
    }

    let value: ts.Expression | undefined;
    if (ts.isObjectLiteralExpression(init)) {
      for (const p of init.properties) {
        if (!ts.isPropertyAssignment(p)) continue;
        const key = ts.isIdentifier(p.name)
          ? p.name.text
          : ts.isStringLiteral(p.name) || ts.isNumericLiteral(p.name)
            ? p.name.text
            : null;
        if (key === propName) {
          value = p.initializer;
          break;
        }
      }
      if (!value) {
        if (!defaultInit) return null;
        value = defaultInit;
      } else if (!isSimpleInitializer(value)) {
        return null;
      }
    } else if (isSimpleInitializer(init)) {
      const access = ts.factory.createPropertyAccessExpression(init, propName);
      value =
        defaultInit != null
          ? ts.factory.createBinaryExpression(
              access,
              ts.SyntaxKind.QuestionQuestionToken,
              defaultInit,
            )
          : access;
    } else {
      return null;
    }
    out.push({ name: el.name.text, initializer: value });
  }
  return out.length > 0 ? { bindings: out, hasRest } : null;
}

function expandArrayBinding(
  pattern: ts.ArrayBindingPattern,
  init: ts.Expression,
): LiftableBindings | null {
  if (pattern.elements.length === 0) return null;
  const out: Array<{ name: string; initializer: ts.Expression }> = [];
  let index = 0;
  let hasRest = false;

  for (const el of pattern.elements) {
    if (ts.isOmittedExpression(el)) {
      index++;
      continue;
    }
    if (!ts.isBindingElement(el)) return null;
    if (el.dotDotDotToken) {
      hasRest = true;
      continue;
    }
    if (!ts.isIdentifier(el.name)) return null;

    const defaultInit =
      el.initializer && isSimpleInitializer(el.initializer) ? el.initializer : null;

    let value: ts.Expression;
    if (ts.isArrayLiteralExpression(init)) {
      const elem = init.elements[index];
      if (!elem || ts.isSpreadElement(elem)) {
        if (!defaultInit) return null;
        value = defaultInit;
      } else if (!isSimpleInitializer(elem as ts.Expression)) {
        return null;
      } else {
        value = elem as ts.Expression;
      }
    } else if (isSimpleInitializer(init)) {
      const access = ts.factory.createElementAccessExpression(
        init,
        ts.factory.createNumericLiteral(index),
      );
      value =
        defaultInit != null
          ? ts.factory.createBinaryExpression(
              access,
              ts.SyntaxKind.QuestionQuestionToken,
              defaultInit,
            )
          : access;
    } else {
      return null;
    }
    out.push({ name: el.name.text, initializer: value });
    index++;
  }
  return out.length > 0 ? { bindings: out, hasRest } : null;
}

/** True when this statement lifts any of `names` (whole stmt should be stripped). */
function statementLiftsNames(stmt: ts.Statement, names: Set<string>): boolean {
  const lifted = collectLiftableBindings(stmt);
  if (!lifted || lifted.hasRest) return false;
  return lifted.bindings.some((b) => names.has(b.name));
}

/** After lifting named bindings, keep `...rest` as a local const destructuring. */
function rewriteRestDestructuringStmt(
  context: ts.TransformationContext,
  stmt: ts.VariableStatement,
  liftedNames: Set<string>,
): ts.Statement | null {
  const lifted = collectLiftableBindings(stmt);
  if (!lifted?.hasRest) return null;
  if (!lifted.bindings.some((b) => liftedNames.has(b.name))) return null;

  const { factory } = context;
  const decl = stmt.declarationList.declarations[0];
  if (!decl?.initializer) return null;

  let newName: ts.BindingName;
  if (ts.isObjectBindingPattern(decl.name)) {
    const restEl = decl.name.elements.find(
      (el) => ts.isBindingElement(el) && !!el.dotDotDotToken,
    );
    if (!restEl || !ts.isBindingElement(restEl)) return null;
    newName = factory.createObjectBindingPattern([restEl]);
  } else if (ts.isArrayBindingPattern(decl.name)) {
    const elements: Array<ts.BindingElement | ts.OmittedExpression> = [];
    for (const el of decl.name.elements) {
      if (ts.isBindingElement(el) && el.dotDotDotToken) {
        elements.push(el);
        continue;
      }
      if (!ts.isBindingElement(el)) {
        elements.push(el);
        continue;
      }
      const bindingName = ts.isIdentifier(el.name) ? el.name.text : null;
      if (bindingName && liftedNames.has(bindingName)) {
        elements.push(factory.createOmittedExpression());
      } else {
        elements.push(el);
      }
    }
    newName = factory.createArrayBindingPattern(elements);
  } else {
    return null;
  }

  return factory.updateVariableStatement(
    stmt,
    stmt.modifiers,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          newName,
          undefined,
          undefined,
          decl.initializer,
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
}

function processLiftedVariableStmt(
  context: ts.TransformationContext,
  stmt: ts.Statement,
  names: Set<string>,
  rewriteStatement: (stmt: ts.Statement) => ts.Statement,
): ts.Statement | 'skip' {
  if (statementLiftsNames(stmt, names)) return 'skip';
  const restRewritten = ts.isVariableStatement(stmt)
    ? rewriteRestDestructuringStmt(context, stmt, names)
    : null;
  if (restRewritten) return rewriteStatement(restRewritten);
  return rewriteStatement(stmt);
}

/**
 * Collect transformable `let` / `const` bindings anywhere in a function block
 * (including nested blocks), but not inside nested functions. Duplicate names
 * abort collection.
 */
function collectLetsInFunctionBody(
  body: ts.Block,
): { lets: Array<{ name: string; initializer: ts.Expression }>; hadDirective: boolean } | null {
  let hadDirective = false;
  const lets: Array<{ name: string; initializer: ts.Expression }> = [];
  const names = new Set<string>();

  const considerStmt = (stmt: ts.Statement): boolean => {
    const lifted = collectLiftableBindings(stmt);
    if (!lifted) return true;
    for (const b of lifted.bindings) {
      if (names.has(b.name)) return false; // shadowing / duplicate → skip site
    }
    for (const b of lifted.bindings) {
      names.add(b.name);
      lets.push(b);
    }
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

  // Initializers must not reference sibling lifted lets (`let a = 1; let b = a + 1`)
  // — object-literal state init cannot see those bindings once stripped.
  const nameSet = new Set(lets.map((l) => l.name));
  for (const l of lets) {
    if (initializerRefsLiftedLets(l.initializer, nameSet)) return null;
  }

  return { lets, hadDirective };
}

function initializerRefsLiftedLets(expr: ts.Expression, names: Set<string>): boolean {
  let found = false;
  const walk = (n: ts.Node) => {
    if (found) return;
    if (
      ts.isArrowFunction(n) ||
      ts.isFunctionExpression(n) ||
      ts.isFunctionDeclaration(n)
    ) {
      return;
    }
    if (ts.isIdentifier(n) && names.has(n.text)) {
      // Property names / labels are not refs; only value positions matter.
      const p = n.parent;
      if (p && ts.isPropertyAccessExpression(p) && p.name === n) return;
      if (p && ts.isPropertyAssignment(p) && p.name === n) return;
      found = true;
      return;
    }
    ts.forEachChild(n, walk);
  };
  walk(expr);
  return found;
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
      const processed = processLiftedVariableStmt(context, stmt, names, rewriteStatement);
      if (processed !== 'skip') out.push(processed);
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
        const processed = processLiftedVariableStmt(
          context,
          stmt.thenStatement,
          names,
          rewriteStatement,
        );
        thenStmt = processed === 'skip' ? factory.createBlock([], true) : processed;
      }
      let elseStmt = stmt.elseStatement;
      if (elseStmt) {
        if (ts.isBlock(elseStmt)) {
          elseStmt = factory.updateBlock(elseStmt, filterStatements(elseStmt.statements, false));
        } else {
          const processed = processLiftedVariableStmt(
            context,
            elseStmt,
            names,
            rewriteStatement,
          );
          elseStmt = processed === 'skip' ? factory.createBlock([], true) : processed;
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
        const stmts = clause.statements.flatMap((s) => {
          const processed = processLiftedVariableStmt(context, s, names, rewriteStatement);
          return processed === 'skip' ? [] : [processed];
        });
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
  if (isInsideTypeSubtree(n)) return false;
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
  if (ts.isTypeAliasDeclaration(p) && p.name === n) return false;
  if (ts.isInterfaceDeclaration(p) && p.name === n) return false;
  if (ts.isEnumMember(p) && p.name === n) return false;
  return true;
}

/** True when `node` sits under a type alias / interface / type annotation AST. */
function isInsideTypeSubtree(node: ts.Node): boolean {
  let cur: ts.Node | undefined = node.parent;
  while (cur) {
    if (ts.isTypeAliasDeclaration(cur) || ts.isInterfaceDeclaration(cur)) return true;
    if (ts.isTypeNode(cur)) return true;
    if (ts.isTypeParameterDeclaration(cur)) return true;
    if (isFunctionLike(cur) || ts.isSourceFile(cur) || ts.isModuleBlock(cur)) return false;
    cur = cur.parent;
  }
  return false;
}

function rewriteIdents(
  context: ts.TransformationContext,
  node: ts.Node,
  names: Set<string>,
  stateIdent: ts.Identifier,
): ts.Node {
  const { factory } = context;
  const visit = (n: ts.Node): ts.Node => {
    // Never rewrite identifiers inside type-only trees (property keys, refs, …).
    if (
      ts.isTypeAliasDeclaration(n) ||
      ts.isInterfaceDeclaration(n) ||
      ts.isTypeParameterDeclaration(n) ||
      ts.isTypeNode(n)
    ) {
      return n;
    }
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

function isFunctionLike(node: ts.Node): boolean {
  return (
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  );
}

function isStatePropAccess(
  n: ts.Node,
  stateIdent: ts.Identifier,
  names: Set<string>,
): n is ts.PropertyAccessExpression {
  return (
    ts.isPropertyAccessExpression(n) &&
    ts.isIdentifier(n.expression) &&
    n.expression.text === stateIdent.text &&
    ts.isIdentifier(n.name) &&
    names.has(n.name.text)
  );
}

/** True when `node` is the write target of an assignment or ±± update. */
function isWriteTarget(node: ts.Node, parent: ts.Node | undefined): boolean {
  if (!parent) return false;
  if (ts.isPostfixUnaryExpression(parent) || ts.isPrefixUnaryExpression(parent)) {
    return (
      parent.operand === node &&
      (parent.operator === ts.SyntaxKind.PlusPlusToken ||
        parent.operator === ts.SyntaxKind.MinusMinusToken)
    );
  }
  if (ts.isBinaryExpression(parent) && parent.left === node) {
    const op = parent.operatorToken.kind;
    return (
      op === ts.SyntaxKind.EqualsToken ||
      op === ts.SyntaxKind.PlusEqualsToken ||
      op === ts.SyntaxKind.MinusEqualsToken ||
      op === ts.SyntaxKind.AsteriskEqualsToken ||
      op === ts.SyntaxKind.SlashEqualsToken ||
      op === ts.SyntaxKind.PercentEqualsToken ||
      op === ts.SyntaxKind.BarEqualsToken ||
      op === ts.SyntaxKind.AmpersandEqualsToken ||
      op === ts.SyntaxKind.CaretEqualsToken ||
      op === ts.SyntaxKind.LessThanLessThanEqualsToken ||
      op === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken ||
      op === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken ||
      op === ts.SyntaxKind.AsteriskAsteriskEqualsToken ||
      op === ts.SyntaxKind.BarBarEqualsToken ||
      op === ts.SyntaxKind.AmpersandAmpersandEqualsToken ||
      op === ts.SyntaxKind.QuestionQuestionEqualsToken
    );
  }
  return false;
}

/**
 * True if `node` **reads** `stateIdent.name` while building UI (not inside nested
 * function bodies — those are handler / child-builder closures). Writes alone
 * (`s.n++`, `s.n = …`) do not count — they must not force an `auto` region.
 */
function readsStateDuringBuild(
  node: ts.Node,
  stateIdent: ts.Identifier,
  names: Set<string>,
): boolean {
  return collectStateReadsDuringBuild(node, stateIdent, names).size > 0;
}

/** Build-time state property reads (skips nested functions; ignores writes). */
function collectStateReadsDuringBuild(
  node: ts.Node,
  stateIdent: ts.Identifier,
  names: Set<string>,
): Set<string> {
  const reads = new Set<string>();
  const walk = (n: ts.Node, parent: ts.Node | undefined) => {
    if (isFunctionLike(n)) return;
    if (isStatePropAccess(n, stateIdent, names) && !isWriteTarget(n, parent)) {
      reads.add(n.name.text);
    }
    ts.forEachChild(n, (child) => walk(child, n));
  };
  walk(node, undefined);
  return reads;
}

function setsIntersect(a: Set<string>, b: Set<string>): boolean {
  for (const x of a) {
    if (b.has(x)) return true;
  }
  return false;
}

function createAutoCall(
  factory: ts.NodeFactory,
  stmts: ts.Statement[],
  useUi: boolean,
): ts.ExpressionStatement {
  const autoArg = factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    factory.createBlock(stmts, true),
  );
  const autoCall = useUi
    ? factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('ui'), 'auto'),
        undefined,
        [autoArg],
      )
    : factory.createCallExpression(factory.createIdentifier('auto'), undefined, [autoArg]);
  return factory.createExpressionStatement(autoCall);
}

function isAutoCallStatement(stmt: ts.Statement): boolean {
  if (!ts.isExpressionStatement(stmt) || !ts.isCallExpression(stmt.expression)) return false;
  const callee = stmt.expression.expression;
  if (ts.isIdentifier(callee) && callee.text === 'auto') return true;
  return (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    callee.name.text === 'auto'
  );
}

function isLabelCallee(expr: ts.Expression): boolean {
  if (ts.isIdentifier(expr) && expr.text === 'label') return true;
  return (
    ts.isPropertyAccessExpression(expr) &&
    ts.isIdentifier(expr.expression) &&
    expr.expression.text === 'ui' &&
    ts.isIdentifier(expr.name) &&
    expr.name.text === 'label'
  );
}

/**
 * `ui.label(expr)` / `label(expr)` (optionally chained `.classes(...)`) whose
 * text reads state → `ui.label(() => expr)` (runtime `bindText`).
 */
function tryRewriteLabelBindText(
  factory: ts.NodeFactory,
  stmt: ts.Statement,
  stateIdent: ts.Identifier,
  names: Set<string>,
): ts.Statement | null {
  if (!ts.isExpressionStatement(stmt)) return null;

  // Unwrap trailing `.classes(...)` / `.className(...)` calls to find `label(...)`.
  let expr: ts.Expression = stmt.expression;
  const trail: ts.CallExpression[] = [];
  while (ts.isCallExpression(expr) && ts.isPropertyAccessExpression(expr.expression)) {
    const method = expr.expression.name.text;
    if (method !== 'classes' && method !== 'className') break;
    trail.unshift(expr);
    expr = expr.expression.expression;
  }

  if (!ts.isCallExpression(expr) || !isLabelCallee(expr.expression) || expr.arguments.length === 0) {
    return null;
  }

  const textArg = expr.arguments[0]!;
  if (ts.isArrowFunction(textArg) || ts.isFunctionExpression(textArg)) return null;
  if (!readsStateDuringBuild(textArg, stateIdent, names)) return null;

  const compute = factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    textArg,
  );
  const newArgs = factory.createNodeArray([compute, ...expr.arguments.slice(1)]);
  let rebuilt: ts.Expression = factory.updateCallExpression(
    expr,
    expr.expression,
    expr.typeArguments,
    newArgs,
  );
  for (const call of trail) {
    rebuilt = factory.updateCallExpression(
      call,
      factory.createPropertyAccessExpression(
        rebuilt,
        (call.expression as ts.PropertyAccessExpression).name,
      ),
      call.typeArguments,
      call.arguments,
    );
  }
  return factory.updateExpressionStatement(stmt, rebuilt);
}

/**
 * Split statements into inert vs reactive regions:
 * - `ui.label(expr)` reading state → compile-time `bindText` (`label(() => expr)`)
 * - other build-time reads → `ui.auto`, **dependency-isolated** when read-sets are
 *   disjoint — but statements that use locals declared in the current run stay
 *   glued together (avoids `const row = …` inside auto and `if (!row)` outside)
 * - nested UI callbacks that read outer state get their own inner regions
 */
function emitWithRegions(
  context: ts.TransformationContext,
  statements: readonly ts.Statement[],
  stateIdent: ts.Identifier,
  names: Set<string>,
  useUi: boolean,
): ts.Statement[] {
  const { factory } = context;

  const injectNested = (stmt: ts.Statement): ts.Statement => {
    const visit = (n: ts.Node): ts.Node => {
      if (
        (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) &&
        n.body &&
        ts.isBlock(n.body)
      ) {
        const innerVisited = ts.visitEachChild(n, visit, context) as
          | ts.ArrowFunction
          | ts.FunctionExpression;
        const body = innerVisited.body as ts.Block;
        if (!body.statements.some((s) => readsStateDuringBuild(s, stateIdent, names))) {
          return innerVisited;
        }

        const withChildRegions = emitWithRegions(
          context,
          body.statements,
          stateIdent,
          names,
          useUi,
        );

        if (ts.isArrowFunction(innerVisited)) {
          return factory.updateArrowFunction(
            innerVisited,
            innerVisited.modifiers,
            innerVisited.typeParameters,
            innerVisited.parameters,
            innerVisited.type,
            innerVisited.equalsGreaterThanToken,
            factory.updateBlock(body, withChildRegions),
          );
        }
        return factory.updateFunctionExpression(
          innerVisited,
          innerVisited.modifiers,
          innerVisited.asteriskToken,
          innerVisited.name,
          innerVisited.typeParameters,
          innerVisited.parameters,
          innerVisited.type,
          factory.updateBlock(body, withChildRegions),
        );
      }
      return ts.visitEachChild(n, visit, context);
    };
    return visit(stmt) as ts.Statement;
  };

  const prepared = statements.map(injectNested);
  const out: ts.Statement[] = [];
  let reactiveRun: ts.Statement[] = [];
  let runDeps = new Set<string>();
  let runLocals = new Set<string>();

  const flush = () => {
    if (reactiveRun.length === 0) return;
    if (reactiveRun.length === 1 && isAutoCallStatement(reactiveRun[0]!)) {
      out.push(reactiveRun[0]!);
    } else {
      out.push(createAutoCall(factory, reactiveRun, useUi));
    }
    reactiveRun = [];
    runDeps = new Set();
    runLocals = new Set();
  };

  const absorb = (stmt: ts.Statement, deps: Set<string>) => {
    reactiveRun.push(stmt);
    for (const d of deps) runDeps.add(d);
    for (const loc of collectDeclaredLocals(stmt)) runLocals.add(loc);
  };

  for (const stmt of prepared) {
    const deps = collectStateReadsDuringBuild(stmt, stateIdent, names);
    const usesLocals = runLocals.size > 0 && statementUsesNames(stmt, runLocals);

    // Once this run declared locals (`const row = …`), keep the rest of the
    // block in the same auto — otherwise `if (!row) return` / trailing actions
    // (Clear) split out and break control flow.
    if (reactiveRun.length > 0 && (usesLocals || runLocals.size > 0)) {
      absorb(stmt, deps);
      continue;
    }

    if (deps.size === 0) {
      flush();
      out.push(stmt);
      continue;
    }

    const bound = tryRewriteLabelBindText(factory, stmt, stateIdent, names);
    if (bound) {
      flush();
      out.push(bound);
      continue;
    }

    if (reactiveRun.length > 0 && !setsIntersect(runDeps, deps)) {
      flush();
    }
    absorb(stmt, deps);
  }
  flush();
  return out;
}

/** Names declared by `const` / `let` / `var` in this statement (top-level decl only). */
function collectDeclaredLocals(stmt: ts.Statement): string[] {
  if (!ts.isVariableStatement(stmt)) return [];
  const out: string[] = [];
  for (const decl of stmt.declarationList.declarations) {
    collectBindingNames(decl.name, out);
  }
  return out;
}

function collectBindingNames(name: ts.BindingName, out: string[]): void {
  if (ts.isIdentifier(name)) {
    out.push(name.text);
    return;
  }
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    for (const el of name.elements) {
      if (ts.isBindingElement(el)) collectBindingNames(el.name, out);
    }
  }
}

/** True if `stmt` references any of `names` as a value (not as a new declaration). */
function statementUsesNames(stmt: ts.Statement, names: Set<string>): boolean {
  let found = false;
  const walk = (n: ts.Node, parent: ts.Node | undefined) => {
    if (found) return;
    if (ts.isIdentifier(n) && names.has(n.text)) {
      if (parent && ts.isVariableDeclaration(parent) && parent.name === n) return;
      if (parent && ts.isBindingElement(parent) && parent.name === n) return;
      if (parent && ts.isPropertyAccessExpression(parent) && parent.name === n) return;
      if (parent && ts.isPropertyAssignment(parent) && parent.name === n) return;
      if (parent && ts.isParameter(parent) && parent.name === n) return;
      found = true;
      return;
    }
    ts.forEachChild(n, (child) => walk(child, n));
  };
  walk(stmt, undefined);
  return found;
}

type TransformSite = {
  fn: ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration;
  lets: Array<{ name: string; initializer: ts.Expression }>;
  hadDirective: boolean;
};

/**
 * Find eligible transform sites.
 *
 * File pragma `// @clay-reactive` applies only to functions that are **not**
 * nested inside another function (module-level fns and e.g. `ui.page` callbacks).
 * Nested `function` / arrow bodies stay plain unless they open with `"use reactive";`.
 */
function findSites(sourceFile: ts.SourceFile, filePragma: boolean): TransformSite[] {
  const sites: TransformSite[] = [];

  const consider = (
    fn: ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration,
    insideFunction: boolean,
  ) => {
    const body = fn.body;
    if (!body || !ts.isBlock(body)) return;
    const collected = collectLetsInFunctionBody(body);
    if (!collected || collected.lets.length === 0) return;
    // File pragma does not inherit into nested helpers / widget callbacks.
    const eligible = collected.hadDirective || (filePragma && !insideFunction);
    if (!eligible) return;
    sites.push({ fn, lets: collected.lets, hadDirective: collected.hadDirective });
  };

  const walk = (node: ts.Node, insideFunction: boolean) => {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)) {
      consider(node, insideFunction);
      ts.forEachChild(node, (child) => walk(child, true));
      return;
    }
    ts.forEachChild(node, (child) => walk(child, insideFunction));
  };
  walk(sourceFile, false);
  return sites;
}

/** Value-position reads of `names` (skips nested functions and type trees). */
function readsLiftedNames(node: ts.Node, names: Set<string>): boolean {
  let found = false;
  const walk = (n: ts.Node, parent: ts.Node | undefined) => {
    if (found) return;
    if (isFunctionLike(n)) return;
    if (ts.isTypeAliasDeclaration(n) || ts.isInterfaceDeclaration(n) || ts.isTypeNode(n)) return;
    if (ts.isIdentifier(n) && names.has(n.text)) {
      if (parent && ts.isVariableDeclaration(parent) && parent.name === n) return;
      if (parent && ts.isBindingElement(parent) && parent.name === n) return;
      if (parent && ts.isPropertyAccessExpression(parent) && parent.name === n) return;
      if (parent && ts.isPropertyAssignment(parent) && parent.name === n) return;
      if (parent && ts.isParameter(parent) && parent.name === n) return;
      if (parent && ts.isFunctionDeclaration(parent) && parent.name === n) return;
      found = true;
      return;
    }
    ts.forEachChild(n, (child) => walk(child, n));
  };
  walk(node, undefined);
  return found;
}

/** Warn when a non-lifted local binding reuses a lifted state name. */
function collectShadowingWarnings(body: ts.Block, liftedNames: Set<string>): string[] {
  if (liftedNames.size === 0) return [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  const walk = (node: ts.Node) => {
    if (isFunctionLike(node)) return;
    if (ts.isVariableStatement(node)) {
      const lifted = collectLiftableBindings(node);
      const liftsHere =
        !!lifted &&
        lifted.bindings.length > 0 &&
        lifted.bindings.every((b) => liftedNames.has(b.name));
      if (!liftsHere) {
        for (const name of namesFromBindingStmt(node)) {
          if (!liftedNames.has(name) || seen.has(name)) continue;
          seen.add(name);
          warnings.push(
            `reactive-let: local '${name}' shadows lifted state — rename the local or the lifted binding`,
          );
        }
      }
    }
    ts.forEachChild(node, walk);
  };

  for (const stmt of body.statements) walk(stmt);
  return warnings;
}

function namesFromBindingStmt(stmt: ts.VariableStatement): string[] {
  const out: string[] = [];
  for (const decl of stmt.declarationList.declarations) {
    collectBindingNames(decl.name, out);
  }
  return out;
}

/** Local builders (function / const fn) whose bodies read lifted state names. */
function collectStateReadingBuilders(body: ts.Block, liftedNames: Set<string>): Set<string> {
  const builders = new Set<string>();

  const noteFn = (name: string, fnBody: ts.ConciseBody) => {
    if (readsLiftedNames(fnBody, liftedNames)) builders.add(name);
  };

  for (const stmt of body.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name && stmt.body) {
      noteFn(stmt.name.text, stmt.body);
    }
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
        const init = decl.initializer;
        if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
          if (init.body) noteFn(decl.name.text, init.body);
        }
      }
    }
  }
  return builders;
}

function isBareBuilderCall(stmt: ts.Statement, builders: Set<string>): boolean {
  if (!ts.isExpressionStatement(stmt)) return false;
  if (isAutoCallStatement(stmt)) return false;
  const expr = stmt.expression;
  if (!ts.isCallExpression(expr) || expr.arguments.length > 0) return false;
  if (!ts.isIdentifier(expr.expression)) return false;
  return builders.has(expr.expression.text);
}

/**
 * Warn when a site-top-level statement calls a local builder that reads lifted
 * lets but is not already wrapped in `ui.auto` / `auto`.
 */
function collectAutoRegionWarnings(body: ts.Block, builders: Set<string>): string[] {
  if (builders.size === 0) return [];
  const warnings: string[] = [];
  for (const stmt of body.statements) {
    if (!isBareBuilderCall(stmt, builders)) continue;
    const name = ((stmt as ts.ExpressionStatement).expression as ts.CallExpression)
      .expression as ts.Identifier;
    warnings.push(
      `reactive-let: ${name.text}() reads lifted state but is not wrapped in ui.auto — ` +
        `UI inside that builder will not rebuild on updates. Use ui.auto(() => { ${name.text}(); }) ` +
        `or inline the UI in the reactive site body.`,
    );
  }
  return warnings;
}

/** Rewrite bare `renderX()` → `ui.auto(() => { renderX(); })`. */
function autoWrapBuilderCalls(
  context: ts.TransformationContext,
  statements: readonly ts.Statement[],
  builders: Set<string>,
  useUi: boolean,
): ts.Statement[] {
  if (builders.size === 0) return [...statements];
  const { factory } = context;
  return statements.map((stmt) => {
    if (!isBareBuilderCall(stmt, builders)) return stmt;
    return createAutoCall(factory, [stmt], useUi);
  });
}

/**
 * Rewrite tracked `let` bindings into `ui.state` / `ui.auto` (or `state` / `auto`).
 *
 * Opt-in via file pragma `// @clay-reactive` (module-level / page callbacks only)
 * or block directive `"use reactive";`. Nested functions do **not** inherit the
 * file pragma — they need their own directive. `ui.page` alone does not opt in.
 *
 * Lifts simple `let` / `const` bindings anywhere in the function body (including
 * nested blocks, but not loops or nested function scopes). Remaining statements
 * use implicit regions: `ui.label(expr)` reading state becomes `ui.label(() => expr)`
 * (`bindText`); other build-time reads go in dependency-isolated `auto`s;
 * inert shell / handler-only writes stay outside. Nested UI callbacks that
 * read outer state get their own inner regions. Bare local builder calls that
 * read lifted state are wrapped in `ui.auto` by default.
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
    return { code: source, transformed: false, lets: [], warnings: [] };
  }

  const useUi = preferUi && fileHasUiImport(sourceFile);
  const autoWrapBuilders = options.autoWrapBuilders !== false;
  const allLets: string[] = [];
  const warnings: string[] = [];
  const buildersBySite = new Map<ts.Node, Set<string>>();
  let counter = 0;

  for (const site of sites) {
    const body = site.fn.body;
    if (!body || !ts.isBlock(body)) continue;
    const names = new Set(site.lets.map((l) => l.name));
    const builders = collectStateReadingBuilders(body, names);
    buildersBySite.set(site.fn, builders);
    warnings.push(...collectShadowingWarnings(body, names));
    if (!autoWrapBuilders) {
      warnings.push(...collectAutoRegionWarnings(body, builders));
    }
  }

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
          const lifted = collectLiftableBindings(stmt);
          if (!lifted) continue;
          for (const b of lifted.bindings) {
            if (names.has(b.name)) initByName.set(b.name, b.initializer);
          }
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

      const builders = buildersBySite.get(node) ?? new Set<string>();
      const withBuilders = autoWrapBuilders
        ? autoWrapBuilderCalls(context, rewrittenRest, builders, useUi)
        : rewrittenRest;

      const regionStmts = emitWithRegions(context, withBuilders, stateName, names, useUi);
      const newBody = factory.createBlock([stateDecl, ...regionStmts], true);

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
    const needsState = /\bstate\s*\(/.test(code) && !/\bimport\s*\{[^}]*\bstate\b/.test(source);
    const needsAuto = /\bauto\s*\(/.test(code) && !/\bimport\s*\{[^}]*\bauto\b/.test(source);
    if (
      (needsState || needsAuto) &&
      !source.includes("from '@close-by/clay'") &&
      !source.includes('from "@close-by/clay"')
    ) {
      const names = [needsState && 'state', needsAuto && 'auto'].filter(Boolean).join(', ');
      code = `import { ${names} } from '@close-by/clay';\n` + code;
    }
  }

  return { code, transformed: true, lets: allLets, warnings };
}

/** True if the source looks like it might need a reactive-let pass (cheap prefilter). */
export function mightNeedReactiveLet(source: string): boolean {
  if (!/\blet\b/.test(source)) return false;
  return hasFilePragma(source) || /["']use reactive["']/.test(source);
}
