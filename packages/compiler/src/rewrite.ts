import * as ts from 'typescript';
import {
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

function shouldSkipIdentifier(node: ts.Identifier, reactive: Set<string>, scope: Scope): boolean {
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
): ts.Node {
  if (ts.isIdentifier(node)) {
    if (shouldSkipIdentifier(node, reactive, scope)) {
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
    return rewriteNode(child, factory, reactive, scope);
  }
}

function expressionHasReactiveRef(
  expr: ts.Expression,
  reactive: Set<string>,
  scope: Scope,
): boolean {
  if (ts.isIdentifier(expr)) {
    return reactive.has(expr.text) && !scope.isShadowed(expr.text);
  }
  if (ts.isPropertyAccessExpression(expr)) {
    if (ts.isIdentifier(expr.expression) && expr.expression.text === STATE_ID) {
      return true;
    }
    return (
      expressionHasReactiveRef(expr.expression, reactive, scope) ||
      expressionHasReactiveRef(expr.name, reactive, scope)
    );
  }
  if (ts.isElementAccessExpression(expr)) {
    return (
      expressionHasReactiveRef(expr.expression, reactive, scope) ||
      expressionHasReactiveRef(expr.argumentExpression, reactive, scope)
    );
  }
  if (ts.isTemplateExpression(expr)) {
    return templateHasReactiveRef(expr, reactive, scope);
  }
  if (ts.isCallExpression(expr) || ts.isNewExpression(expr)) {
    const args = ts.isCallExpression(expr) ? expr.arguments : expr.arguments ?? [];
    if (expressionHasReactiveRef(expr.expression, reactive, scope)) return true;
    return args.some((arg) => expressionHasReactiveRef(arg, reactive, scope));
  }
  if (ts.isBinaryExpression(expr) || ts.isConditionalExpression(expr)) {
    if (ts.isBinaryExpression(expr)) {
      return (
        expressionHasReactiveRef(expr.left, reactive, scope) ||
        expressionHasReactiveRef(expr.right, reactive, scope)
      );
    }
    return (
      expressionHasReactiveRef(expr.condition, reactive, scope) ||
      expressionHasReactiveRef(expr.whenTrue, reactive, scope) ||
      expressionHasReactiveRef(expr.whenFalse, reactive, scope)
    );
  }
  if (ts.isPrefixUnaryExpression(expr) || ts.isPostfixUnaryExpression(expr)) {
    return expressionHasReactiveRef(expr.operand, reactive, scope);
  }
  if (ts.isParenthesizedExpression(expr)) {
    return expressionHasReactiveRef(expr.expression, reactive, scope);
  }
  if (ts.isArrayLiteralExpression(expr)) {
    return expr.elements.some((el) => {
      if (ts.isSpreadElement(el)) {
        return expressionHasReactiveRef(el.expression, reactive, scope);
      }
      return expressionHasReactiveRef(el, reactive, scope);
    });
  }
  if (ts.isObjectLiteralExpression(expr)) {
    return expr.properties.some((prop) => {
      if (ts.isPropertyAssignment(prop)) {
        return expressionHasReactiveRef(prop.initializer, reactive, scope);
      }
      if (ts.isShorthandPropertyAssignment(prop)) {
        return reactive.has(prop.name.text) && !scope.isShadowed(prop.name.text);
      }
      if (ts.isSpreadAssignment(prop)) {
        return expressionHasReactiveRef(prop.expression, reactive, scope);
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
): boolean {
  for (const span of expr.templateSpans) {
    if (expressionHasReactiveRef(span.expression, reactive, scope)) {
      return true;
    }
  }
  return false;
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

function autoBindTemplates(
  node: ts.Node,
  factory: ts.NodeFactory,
  reactive: Set<string>,
  scope: Scope,
): ts.Node {
  if (ts.isCallExpression(node) && isAutoBindCall(node) && node.arguments.length > 0) {
    const firstArg = node.arguments[0]!;
    const isAlreadyGetter =
      ts.isArrowFunction(firstArg) || ts.isFunctionExpression(firstArg);

    let newFirstArg = firstArg;
    if (!isAlreadyGetter && ts.isTemplateExpression(firstArg)) {
      if (templateHasReactiveRef(firstArg, reactive, scope)) {
        newFirstArg = wrapReactiveTemplateArg(factory, firstArg);
      }
    }

    const newArgs = [
      newFirstArg,
      ...node.arguments.slice(1).map((arg) =>
        ts.visitNode(arg, (n) => autoBindTemplates(n, factory, reactive, scope)) as ts.Expression,
      ),
    ];

    return factory.updateCallExpression(node, node.expression, node.typeArguments, newArgs);
  }

  return ts.visitEachChild(node, (child) => autoBindTemplates(child, factory, reactive, scope), undefined);
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

function transformPageCallback(
  callback: ts.ArrowFunction | ts.FunctionExpression,
  bindings: ReactiveBinding[],
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
    (stmt) => ts.visitNode(stmt, (n) => rewriteNode(n, factory, reactive, scope)) as ts.Statement,
  );
  const boundStatements = rewrittenStatements.map(
    (stmt) => ts.visitNode(stmt, (n) => autoBindTemplates(n, factory, reactive, scope)) as ts.Statement,
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
        if (bindings.length === 0) {
          return ts.visitEachChild(node, visitor, context);
        }

        const newCallback = transformPageCallback(callback, bindings, factory);
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
