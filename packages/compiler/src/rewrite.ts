import * as ts from 'typescript';
import {
  collectGlobalStateBindings,
  collectReactiveBindings,
  getPageCallback,
  hasStateParam,
  isPageCall,
  type ReactiveBinding,
} from './collect-reactive';

const STATE_ID = 'state';

/** Component factories whose first string/template arg should auto-bind reactive refs. */
const AUTO_BIND_CALLS = new Set(['label', 'button']);

function createStateAccess(factory: ts.NodeFactory, name: string): ts.PropertyAccessExpression {
  return factory.createPropertyAccessExpression(
    factory.createIdentifier(STATE_ID),
    name,
  );
}

function buildDefaultsCall(
  factory: ts.NodeFactory,
  bindings: ReactiveBinding[],
): ts.ExpressionStatement {
  const properties = bindings.map((binding) =>
    factory.createPropertyAssignment(
      binding.name,
      binding.initializer,
    ),
  );

  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier(STATE_ID),
        'defaults',
      ),
      undefined,
      [factory.createObjectLiteralExpression(properties, true)],
    ),
  );
}

class Scope {
  private stack: Set<string>[] = [new Set()];

  push(): void {
    this.stack.push(new Set());
  }

  pop(): void {
    this.stack.pop();
  }

  declare(name: string): void {
    this.stack[this.stack.length - 1]!.add(name);
  }

  isShadowed(name: string): boolean {
    return this.stack.some((scope) => scope.has(name));
  }
}

function shouldSkipIdentifier(
  node: ts.Identifier,
  reactive: Set<string>,
  scope: Scope,
  globalBindings?: Map<string, string>,
): boolean {
  if (globalBindings?.has(node.text)) return true;
  if (!reactive.has(node.text)) return true;
  if (scope.isShadowed(node.text)) return true;

  const parent = node.parent;
  if (!parent) return true;

  // Declaration name: let count = ...
  if (ts.isVariableDeclaration(parent) && parent.name === node) return true;
  if (ts.isParameter(parent) && parent.name === node) return true;
  if (ts.isBindingElement(parent) && parent.name === node) return true;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return true;
  if (ts.isMethodDeclaration(parent) && parent.name === node) return true;
  if (ts.isFunctionDeclaration(parent) && parent.name === node) return true;

  // Already state.count — do not rewrite the property name
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    if (ts.isIdentifier(parent.expression) && parent.expression.text === STATE_ID) {
      return true;
    }
  }

  // Import/export
  if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) return true;

  return false;
}

function rewriteNode(
  node: ts.Node,
  factory: ts.NodeFactory,
  reactive: Set<string>,
  scope: Scope,
  globalBindings?: Map<string, string>,
): ts.Node {
  if (ts.isIdentifier(node)) {
    if (shouldSkipIdentifier(node, reactive, scope, globalBindings)) {
      return node;
    }
    return createStateAccess(factory, node.text);
  }

  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    const left = node.left;
    if (ts.isIdentifier(left) && reactive.has(left.text) && !scope.isShadowed(left.text)) {
      return factory.createBinaryExpression(
        createStateAccess(factory, left.text),
        ts.SyntaxKind.EqualsToken,
        ts.visitNode(node.right, visit) as ts.Expression,
      );
    }
  }

  if (ts.isFunctionLike(node)) {
    scope.push();
    for (const param of node.parameters) {
      collectParamNames(param, scope);
    }
    const result = ts.visitEachChild(node, visit, undefined);
    scope.pop();
    return result;
  }

  if (ts.isBlock(node)) {
    scope.push();
    for (const stmt of node.statements) {
      if (ts.isVariableStatement(stmt)) {
        for (const decl of stmt.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            scope.declare(decl.name.text);
          }
        }
      }
    }
    const result = ts.visitEachChild(node, visit, undefined);
    scope.pop();
    return result;
  }

  return ts.visitEachChild(node, visit, undefined);

  function visit(child: ts.Node): ts.Node {
    return rewriteNode(child, factory, reactive, scope, globalBindings);
  }
}

function expressionHasReactiveRef(
  expr: ts.Expression,
  reactive: Set<string>,
  scope: Scope,
  globalBindings?: Map<string, string>,
): boolean {
  if (ts.isIdentifier(expr)) {
    if (globalBindings?.has(expr.text) && !scope.isShadowed(expr.text)) return true;
    return reactive.has(expr.text) && !scope.isShadowed(expr.text);
  }
  if (ts.isPropertyAccessExpression(expr)) {
    if (ts.isIdentifier(expr.expression) && expr.expression.text === STATE_ID) {
      return true;
    }
    if (
      ts.isIdentifier(expr.expression) &&
      globalBindings?.has(expr.expression.text) &&
      !scope.isShadowed(expr.expression.text)
    ) {
      return true;
    }
    return (
      expressionHasReactiveRef(expr.expression, reactive, scope, globalBindings) ||
      expressionHasReactiveRef(expr.name, reactive, scope, globalBindings)
    );
  }
  if (ts.isElementAccessExpression(expr)) {
    return (
      expressionHasReactiveRef(expr.expression, reactive, scope, globalBindings) ||
      expressionHasReactiveRef(expr.argumentExpression, reactive, scope, globalBindings)
    );
  }
  if (ts.isTemplateExpression(expr)) {
    return templateHasReactiveRef(expr, reactive, scope, globalBindings);
  }
  if (ts.isCallExpression(expr) || ts.isNewExpression(expr)) {
    const args = ts.isCallExpression(expr) ? expr.arguments : expr.arguments ?? [];
    if (expressionHasReactiveRef(expr.expression, reactive, scope, globalBindings)) return true;
    return args.some((arg) => expressionHasReactiveRef(arg, reactive, scope, globalBindings));
  }
  if (ts.isBinaryExpression(expr) || ts.isConditionalExpression(expr)) {
    if (ts.isBinaryExpression(expr)) {
      return (
        expressionHasReactiveRef(expr.left, reactive, scope, globalBindings) ||
        expressionHasReactiveRef(expr.right, reactive, scope, globalBindings)
      );
    }
    return (
      expressionHasReactiveRef(expr.condition, reactive, scope, globalBindings) ||
      expressionHasReactiveRef(expr.whenTrue, reactive, scope, globalBindings) ||
      expressionHasReactiveRef(expr.whenFalse, reactive, scope, globalBindings)
    );
  }
  if (ts.isPrefixUnaryExpression(expr) || ts.isPostfixUnaryExpression(expr)) {
    return expressionHasReactiveRef(expr.operand, reactive, scope, globalBindings);
  }
  if (ts.isParenthesizedExpression(expr)) {
    return expressionHasReactiveRef(expr.expression, reactive, scope, globalBindings);
  }
  if (ts.isArrayLiteralExpression(expr)) {
    return expr.elements.some((el) => {
      if (ts.isSpreadElement(el)) {
        return expressionHasReactiveRef(el.expression, reactive, scope, globalBindings);
      }
      return expressionHasReactiveRef(el, reactive, scope, globalBindings);
    });
  }
  if (ts.isObjectLiteralExpression(expr)) {
    return expr.properties.some((prop) => {
      if (ts.isPropertyAssignment(prop)) {
        return expressionHasReactiveRef(prop.initializer, reactive, scope, globalBindings);
      }
      if (ts.isShorthandPropertyAssignment(prop)) {
        if (globalBindings?.has(prop.name.text) && !scope.isShadowed(prop.name.text)) return true;
        return reactive.has(prop.name.text) && !scope.isShadowed(prop.name.text);
      }
      if (ts.isSpreadAssignment(prop)) {
        return expressionHasReactiveRef(prop.expression, reactive, scope, globalBindings);
      }
      return false;
    });
  }
  return false;
}

function templateHasReactiveRef(
  expr: ts.TemplateExpression,
  reactive: Set<string>,
  scope: Scope,
  globalBindings?: Map<string, string>,
): boolean {
  for (const span of expr.templateSpans) {
    if (expressionHasReactiveRef(span.expression, reactive, scope, globalBindings)) {
      return true;
    }
  }
  return false;
}

/** True when every interpolated expression can run client-side as a Datastar signal expression. */
function expressionIsDatastarBindable(
  expr: ts.Expression,
  reactive: Set<string>,
  scope: Scope,
  constBindings?: Map<string, ts.Expression>,
  globalBindings?: Map<string, string>,
): boolean {
  if (ts.isIdentifier(expr)) {
    if (globalBindings?.has(expr.text) && !scope.isShadowed(expr.text)) {
      return true;
    }
    if (reactive.has(expr.text) && !scope.isShadowed(expr.text)) {
      return true;
    }
    if (scope.isShadowed(expr.text)) {
      return true;
    }
    if (constBindings && !scope.isShadowed(expr.text) && constBindings.has(expr.text)) {
      return expressionIsDatastarBindable(constBindings.get(expr.text)!, reactive, scope, constBindings, globalBindings);
    }
    return false;
  }

  if (ts.isArrowFunction(expr)) {
    if (expr.parameters.length !== 1) return false;
    const param = expr.parameters[0]!;
    if (!ts.isIdentifier(param.name)) return false;
    if (ts.isBlock(expr.body)) return false;
    const innerScope = new Scope();
    innerScope.push();
    innerScope.declare(param.name.text);
    if (ts.isTemplateExpression(expr.body)) {
      return templateIsDatastarBindable(expr.body, reactive, innerScope, constBindings, globalBindings);
    }
    return expressionIsDatastarBindable(expr.body, reactive, innerScope, constBindings, globalBindings);
  }

  if (ts.isTemplateExpression(expr)) {
    return templateIsDatastarBindable(expr, reactive, scope, constBindings, globalBindings);
  }

  if (ts.isPropertyAccessExpression(expr)) {
    if (ts.isIdentifier(expr.expression) && expr.expression.text === STATE_ID) {
      return true;
    }
    if (
      ts.isIdentifier(expr.expression) &&
      globalBindings?.has(expr.expression.text) &&
      !scope.isShadowed(expr.expression.text)
    ) {
      return true;
    }
    return expressionIsDatastarBindable(expr.expression, reactive, scope, constBindings, globalBindings);
  }

  if (ts.isElementAccessExpression(expr)) {
    return (
      expressionIsDatastarBindable(expr.expression, reactive, scope, constBindings, globalBindings) &&
      expressionIsDatastarBindable(expr.argumentExpression, reactive, scope, constBindings, globalBindings)
    );
  }

  if (ts.isCallExpression(expr)) {
    if (!expressionIsDatastarBindable(expr.expression, reactive, scope, constBindings, globalBindings)) {
      return false;
    }
    return expr.arguments.every((arg) => {
      if (ts.isSpreadElement(arg)) return false;
      return expressionIsDatastarBindable(arg, reactive, scope, constBindings, globalBindings);
    });
  }

  if (ts.isStringLiteral(expr) || ts.isNumericLiteral(expr)) {
    return true;
  }

  if (expr.kind === ts.SyntaxKind.TrueKeyword || expr.kind === ts.SyntaxKind.FalseKeyword) {
    return true;
  }

  if (ts.isPrefixUnaryExpression(expr) || ts.isPostfixUnaryExpression(expr)) {
    return expressionIsDatastarBindable(expr.operand, reactive, scope, constBindings, globalBindings);
  }

  if (ts.isBinaryExpression(expr)) {
    return (
      expressionIsDatastarBindable(expr.left, reactive, scope, constBindings, globalBindings) &&
      expressionIsDatastarBindable(expr.right, reactive, scope, constBindings, globalBindings)
    );
  }

  if (ts.isConditionalExpression(expr)) {
    return (
      expressionIsDatastarBindable(expr.condition, reactive, scope, constBindings, globalBindings) &&
      expressionIsDatastarBindable(expr.whenTrue, reactive, scope, constBindings, globalBindings) &&
      expressionIsDatastarBindable(expr.whenFalse, reactive, scope, constBindings, globalBindings)
    );
  }

  if (ts.isParenthesizedExpression(expr)) {
    return expressionIsDatastarBindable(expr.expression, reactive, scope, constBindings, globalBindings);
  }

  return false;
}

function templateIsDatastarBindable(
  template: ts.TemplateExpression,
  reactive: Set<string>,
  scope: Scope,
  constBindings?: Map<string, ts.Expression>,
  globalBindings?: Map<string, string>,
): boolean {
  return template.templateSpans.every((span) =>
    expressionIsDatastarBindable(span.expression, reactive, scope, constBindings, globalBindings),
  );
}

function isAutoBindCall(call: ts.CallExpression): boolean {
  if (ts.isIdentifier(call.expression) && AUTO_BIND_CALLS.has(call.expression.text)) {
    return true;
  }
  if (
    ts.isPropertyAccessExpression(call.expression) &&
    ts.isIdentifier(call.expression.expression) &&
    call.expression.expression.text === 'ui' &&
    ts.isIdentifier(call.expression.name) &&
    AUTO_BIND_CALLS.has(call.expression.name.text)
  ) {
    return true;
  }
  return false;
}

function expressionToDatastarExpr(
  expr: ts.Expression,
  factory: ts.NodeFactory,
  reactive: Set<string>,
  scope: Scope,
  constBindings?: Map<string, ts.Expression>,
  globalBindings?: Map<string, string>,
): string {
  if (ts.isIdentifier(expr)) {
    if (globalBindings && !scope.isShadowed(expr.text) && globalBindings.has(expr.text)) {
      return `$${globalBindings.get(expr.text)!}`;
    }
    if (reactive.has(expr.text) && !scope.isShadowed(expr.text)) {
      return `$${expr.text}`;
    }
    if (scope.isShadowed(expr.text)) {
      return expr.text;
    }
    if (constBindings && !scope.isShadowed(expr.text) && constBindings.has(expr.text)) {
      return expressionToDatastarExpr(constBindings.get(expr.text)!, factory, reactive, scope, constBindings, globalBindings);
    }
    return expr.text;
  }

  if (ts.isTemplateExpression(expr)) {
    return templateToTextExpr(expr, factory, reactive, scope, constBindings, globalBindings);
  }

  if (ts.isArrowFunction(expr)) {
    const param = expr.parameters[0];
    if (!param || !ts.isIdentifier(param.name) || ts.isBlock(expr.body)) {
      return '""';
    }
    const innerScope = new Scope();
    innerScope.push();
    innerScope.declare(param.name.text);
    const body = ts.isTemplateExpression(expr.body)
      ? templateToTextExpr(expr.body, factory, reactive, innerScope, constBindings, globalBindings)
      : expressionToDatastarExpr(expr.body, factory, reactive, innerScope, constBindings, globalBindings);
    return `${param.name.text} => ${body}`;
  }

  if (ts.isPropertyAccessExpression(expr)) {
    if (ts.isIdentifier(expr.expression) && expr.expression.text === STATE_ID) {
      return `$${expr.name.text}`;
    }
    if (
      ts.isIdentifier(expr.expression) &&
      reactive.has(expr.expression.text) &&
      !scope.isShadowed(expr.expression.text)
    ) {
      return `$${expr.expression.text}.${expr.name.text}`;
    }
    if (
      ts.isIdentifier(expr.expression) &&
      globalBindings?.has(expr.expression.text) &&
      !scope.isShadowed(expr.expression.text)
    ) {
      return `$${globalBindings.get(expr.expression.text)!}.${expr.name.text}`;
    }
    const obj = expressionToDatastarExpr(expr.expression, factory, reactive, scope, constBindings, globalBindings);
    return `${obj}.${expr.name.text}`;
  }

  if (ts.isElementAccessExpression(expr)) {
    const obj = expressionToDatastarExpr(expr.expression, factory, reactive, scope, constBindings, globalBindings);
    const index = expr.argumentExpression;
    if (ts.isStringLiteral(index)) {
      return `${obj}['${index.text}']`;
    }
    if (ts.isNumericLiteral(index)) {
      return `${obj}[${index.text}]`;
    }
    return `${obj}[${expressionToDatastarExpr(index, factory, reactive, scope, constBindings, globalBindings)}]`;
  }

  if (ts.isCallExpression(expr)) {
    const callee = expressionToDatastarExpr(expr.expression, factory, reactive, scope, constBindings, globalBindings);
    const args = expr.arguments.map((arg) =>
      expressionToDatastarExpr(arg as ts.Expression, factory, reactive, scope, constBindings, globalBindings),
    );
    return `${callee}(${args.join(', ')})`;
  }

  if (ts.isStringLiteral(expr)) {
    return `'${expr.text.replace(/'/g, "\\'")}'`;
  }

  if (ts.isNumericLiteral(expr)) {
    return expr.text;
  }

  if (ts.isPrefixUnaryExpression(expr)) {
    const op = ts.tokenToString(expr.operator) ?? '';
    return `${op}${expressionToDatastarExpr(expr.operand, factory, reactive, scope, constBindings, globalBindings)}`;
  }

  if (ts.isBinaryExpression(expr)) {
    const left = expressionToDatastarExpr(expr.left, factory, reactive, scope, constBindings, globalBindings);
    const right = expressionToDatastarExpr(expr.right, factory, reactive, scope, constBindings, globalBindings);
    return `${left} ${expr.operator} ${right}`;
  }

  if (ts.isParenthesizedExpression(expr)) {
    return `(${expressionToDatastarExpr(expr.expression, factory, reactive, scope, constBindings, globalBindings)})`;
  }

  return '""';
}

function templateToTextExpr(
  template: ts.TemplateExpression,
  factory: ts.NodeFactory,
  reactive: Set<string>,
  scope: Scope,
  constBindings?: Map<string, ts.Expression>,
  globalBindings?: Map<string, string>,
): string {
  const parts: string[] = [`'${template.head.text.replace(/'/g, "\\'")}'`];
  for (const span of template.templateSpans) {
    const exprStr = expressionToDatastarExpr(span.expression, factory, reactive, scope, constBindings, globalBindings);
    parts.push(exprStr);
    if (span.literal.text) {
      parts.push(`'${span.literal.text.replace(/'/g, "\\'")}'`);
    }
  }
  return parts.join(' + ');
}

function buildTextExprProps(
  factory: ts.NodeFactory,
  textExpr: string,
  existingProps?: ts.Expression,
): ts.ObjectLiteralExpression {
  const props = [
    factory.createPropertyAssignment('textExpr', factory.createStringLiteral(textExpr)),
  ];

  if (existingProps && ts.isObjectLiteralExpression(existingProps)) {
    for (const prop of existingProps.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'textExpr') {
        continue;
      }
      props.push(prop as ts.PropertyAssignment);
    }
  }

  return factory.createObjectLiteralExpression(props, false);
}

function wrapReactiveTemplateArg(
  factory: ts.NodeFactory,
  arg: ts.Expression,
): ts.ArrowFunction {
  return factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    arg,
  );
}

function collectConstBindings(statements: ts.Statement[]): Map<string, ts.Expression> {
  const bindings = new Map<string, ts.Expression>();
  for (const statement of statements) {
    if (!ts.isVariableStatement(statement)) continue;
    if ((statement.declarationList.flags & ts.NodeFlags.Const) === 0) continue;
    for (const decl of statement.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.initializer) {
        bindings.set(decl.name.text, decl.initializer);
      }
    }
  }
  return bindings;
}

function autoBindTemplates(
  node: ts.Node,
  factory: ts.NodeFactory,
  reactive: Set<string>,
  scope: Scope,
  constBindings?: Map<string, ts.Expression>,
  globalBindings?: Map<string, string>,
): ts.Node {
  if (ts.isCallExpression(node) && isAutoBindCall(node) && node.arguments.length > 0) {
    const firstArg = node.arguments[0]!;
    const secondArg = node.arguments[1];
    const isAlreadyGetter =
      ts.isArrowFunction(firstArg) || ts.isFunctionExpression(firstArg);

    if (!isAlreadyGetter && ts.isTemplateExpression(firstArg)) {
      if (
        templateHasReactiveRef(firstArg, reactive, scope, globalBindings) &&
        templateIsDatastarBindable(firstArg, reactive, scope, constBindings, globalBindings)
      ) {
        const textExpr = templateToTextExpr(firstArg, factory, reactive, scope, constBindings, globalBindings);
        const propsArg = buildTextExprProps(factory, textExpr, secondArg);
        return factory.updateCallExpression(
          node,
          node.expression,
          node.typeArguments,
          [propsArg],
        );
      }
    }

    if (!isAlreadyGetter && ts.isStringLiteral(firstArg)) {
      const newArgs = [
        firstArg,
        ...node.arguments.slice(1).map((arg) =>
          ts.visitNode(arg, (n) => autoBindTemplates(n, factory, reactive, scope, constBindings, globalBindings)) as ts.Expression,
        ),
      ];
      return factory.updateCallExpression(node, node.expression, node.typeArguments, newArgs);
    }

    let newFirstArg = firstArg;
    if (!isAlreadyGetter && ts.isTemplateExpression(firstArg)) {
      if (templateHasReactiveRef(firstArg, reactive, scope, globalBindings)) {
        newFirstArg = wrapReactiveTemplateArg(factory, firstArg);
      }
    }

    const newArgs = [
      newFirstArg,
      ...node.arguments.slice(1).map((arg) =>
        ts.visitNode(arg, (n) => autoBindTemplates(n, factory, reactive, scope, constBindings, globalBindings)) as ts.Expression,
      ),
    ];

    return factory.updateCallExpression(node, node.expression, node.typeArguments, newArgs);
  }

  return ts.visitEachChild(node, (child) => autoBindTemplates(child, factory, reactive, scope, constBindings, globalBindings), undefined);
}

function collectParamNames(param: ts.ParameterDeclaration, scope: Scope): void {
  if (ts.isIdentifier(param.name)) {
    scope.declare(param.name.text);
    return;
  }
  if (ts.isObjectBindingPattern(param.name) || ts.isArrayBindingPattern(param.name)) {
    for (const element of param.name.elements) {
      if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
        scope.declare(element.name.text);
      }
    }
  }
}

function bindGlobalPageCallback(
  callback: ts.ArrowFunction | ts.FunctionExpression,
  globalBindings: Map<string, string>,
  factory: ts.NodeFactory,
): ts.ArrowFunction | ts.FunctionExpression {
  const body = callback.body;
  if (!ts.isBlock(body)) {
    return callback;
  }

  const reactive = new Set<string>();
  const scope = new Scope();
  const constBindings = collectConstBindings(body.statements);
  const boundStatements = body.statements.map(
    (stmt) => ts.visitNode(stmt, (n) => autoBindTemplates(n, factory, reactive, scope, constBindings, globalBindings)) as ts.Statement,
  );
  const newBody = factory.createBlock(boundStatements, true);

  if (ts.isArrowFunction(callback)) {
    return factory.updateArrowFunction(
      callback,
      callback.modifiers,
      callback.typeParameters,
      callback.parameters,
      callback.type,
      callback.equalsGreaterThanToken,
      newBody,
    );
  }

  return factory.updateFunctionExpression(
    callback,
    callback.modifiers,
    callback.asteriskToken,
    callback.name,
    callback.typeParameters,
    callback.parameters,
    callback.type,
    newBody,
  );
}

function transformPageCallback(
  callback: ts.ArrowFunction | ts.FunctionExpression,
  bindings: ReactiveBinding[],
  globalBindings: Map<string, string>,
  factory: ts.NodeFactory,
): ts.ArrowFunction | ts.FunctionExpression {
  const reactive = new Set(bindings.map((b) => b.name));
  const body = callback.body;

  if (!ts.isBlock(body)) {
    return callback;
  }

  const reactiveNames = new Set(bindings.map((b) => b.name));
  const newStatements: ts.Statement[] = [buildDefaultsCall(factory, bindings)];

  for (const statement of body.statements) {
    if (ts.isVariableStatement(statement)) {
      const isReactiveLet =
        (statement.declarationList.flags & ts.NodeFlags.Let) !== 0 &&
        statement.declarationList.declarations.every(
          (decl) => ts.isIdentifier(decl.name) && reactiveNames.has(decl.name.text),
        );
      if (isReactiveLet) {
        continue;
      }
    }
    newStatements.push(statement);
  }

  const scope = new Scope();
  const rewrittenStatements = newStatements.map(
    (stmt) => ts.visitNode(stmt, (n) => rewriteNode(n, factory, reactive, scope, globalBindings)) as ts.Statement,
  );
  const constBindings = collectConstBindings(rewrittenStatements);
  const boundStatements = rewrittenStatements.map(
    (stmt) => ts.visitNode(stmt, (n) => autoBindTemplates(n, factory, reactive, scope, constBindings, globalBindings)) as ts.Statement,
  );
  const newBody = factory.createBlock(boundStatements, true);

  const stateParam = factory.createParameterDeclaration(
    undefined,
    undefined,
    factory.createObjectBindingPattern([
      factory.createBindingElement(undefined, undefined, 'state', undefined),
    ]),
    undefined,
    undefined,
    undefined,
  );

  if (ts.isArrowFunction(callback)) {
    return factory.updateArrowFunction(
      callback,
      callback.modifiers,
      callback.typeParameters,
      [stateParam],
      callback.type,
      callback.equalsGreaterThanToken,
      newBody,
    );
  }

  return factory.updateFunctionExpression(
    callback,
    callback.modifiers,
    callback.asteriskToken,
    callback.name,
    callback.typeParameters,
    [stateParam],
    callback.type,
    newBody,
  );
}

export function createPageTransformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
  const factory = context.factory;

  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (isPageCall(node)) {
        const callback = getPageCallback(node);
        if (!callback || hasStateParam(callback.parameters)) {
          return ts.visitEachChild(node, visitor, context);
        }

        const bindings = collectReactiveBindings(callback.body);
        const globalBindings = collectGlobalStateBindings(callback.body);
        if (bindings.length === 0 && globalBindings.size === 0) {
          return ts.visitEachChild(node, visitor, context);
        }

        const newCallback = bindings.length === 0
          ? bindGlobalPageCallback(callback, globalBindings, factory)
          : transformPageCallback(callback, bindings, globalBindings, factory);
        const newArgs = [node.arguments[0]!, newCallback, ...node.arguments.slice(2)];

        return factory.updateCallExpression(
          node,
          node.expression,
          node.typeArguments,
          newArgs,
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
}

export function findPageCalls(sourceFile: ts.SourceFile): ts.CallExpression[] {
  const calls: ts.CallExpression[] = [];

  const visit = (node: ts.Node) => {
    if (isPageCall(node)) {
      calls.push(node);
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return calls;
}
