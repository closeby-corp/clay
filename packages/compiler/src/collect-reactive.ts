import * as ts from 'typescript';
import { isExcludedInitializer } from './excluded-inits';

export interface ReactiveBinding {
  name: string;
  initializer: ts.Expression;
}

export function hasStateParam(params: ts.NodeArray<ts.ParameterDeclaration>): boolean {
  for (const param of params) {
    if (ts.isObjectBindingPattern(param.name)) {
      for (const element of param.name.elements) {
        if (ts.isBindingElement(element) && ts.isIdentifier(element.name) && element.name.text === 'state') {
          return true;
        }
        if (ts.isBindingElement(element) && ts.isIdentifier(element.propertyName) && element.propertyName.text === 'state') {
          return true;
        }
      }
    }
    if (ts.isIdentifier(param.name) && param.name.text === 'state') {
      return true;
    }
  }
  return false;
}

/** `const messages = GlobalState.create('chatMessages', [])` → messages → chatMessages signal */
export function collectGlobalStateBindings(body: ts.ConciseBody): Map<string, string> {
  const bindings = new Map<string, string>();
  if (!ts.isBlock(body)) {
    return bindings;
  }

  for (const statement of body.statements) {
    if (!ts.isVariableStatement(statement)) continue;

    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
      const signalKey = globalStateCreateKey(decl.initializer);
      if (signalKey) {
        bindings.set(decl.name.text, signalKey);
      }
    }
  }

  return bindings;
}

function globalStateCreateKey(expr: ts.Expression): string | null {
  if (!ts.isCallExpression(expr)) return null;
  const callee = expr.expression;
  if (!ts.isPropertyAccessExpression(callee)) return null;
  if (!ts.isIdentifier(callee.expression) || callee.expression.text !== 'GlobalState') return null;
  if (callee.name.text !== 'create') return null;
  const firstArg = expr.arguments[0];
  if (!firstArg || !ts.isStringLiteral(firstArg)) return null;
  return firstArg.text;
}

export function collectReactiveBindings(body: ts.ConciseBody): ReactiveBinding[] {
  if (!ts.isBlock(body)) {
    return [];
  }

  const bindings: ReactiveBinding[] = [];

  for (const statement of body.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    if ((statement.declarationList.flags & ts.NodeFlags.Let) === 0) continue;

    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) continue;
      if (!decl.initializer) continue;
      if (isExcludedInitializer(decl.initializer)) continue;

      bindings.push({
        name: decl.name.text,
        initializer: decl.initializer,
      });
    }
  }

  return bindings;
}

function getPageCalleeName(node: ts.CallExpression): string | null {
  if (ts.isIdentifier(node.expression) && node.expression.text === 'page') {
    return 'page';
  }
  if (
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === 'ui' &&
    ts.isIdentifier(node.expression.name) &&
    node.expression.name.text === 'page'
  ) {
    return 'ui.page';
  }
  return null;
}

export function isPageCall(node: ts.Node): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) return false;
  if (!getPageCalleeName(node)) return false;
  if (node.arguments.length < 2) return false;

  const callback = node.arguments[1];
  return ts.isArrowFunction(callback) || ts.isFunctionExpression(callback);
}

export function getPageCallback(node: ts.CallExpression): ts.ArrowFunction | ts.FunctionExpression | undefined {
  const callback = node.arguments[1];
  if (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) {
    return callback;
  }
  return undefined;
}
