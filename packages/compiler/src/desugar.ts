import * as ts from 'typescript';

/**
 * Desugar compound assignment and update expressions before reactive rewrite.
 * count += 1 → count = count + 1
 * count++ / ++count / --count → count = count ± 1
 */
export function createDesugarTransformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
  const factory = context.factory;

  const desugarExpression = (node: ts.Expression): ts.Expression => {
    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.kind;
      if (
        op === ts.SyntaxKind.PlusEqualsToken ||
        op === ts.SyntaxKind.MinusEqualsToken ||
        op === ts.SyntaxKind.AsteriskEqualsToken ||
        op === ts.SyntaxKind.SlashEqualsToken ||
        op === ts.SyntaxKind.PercentEqualsToken
      ) {
        const binaryOp = equalsToBinaryOp(op);
        if (binaryOp && ts.isIdentifier(node.left)) {
          return factory.createBinaryExpression(
            node.left,
            ts.SyntaxKind.EqualsToken,
            factory.createBinaryExpression(
              ts.visitNode(node.left, visit) as ts.Expression,
              binaryOp,
              ts.visitNode(node.right, visit) as ts.Expression,
            ),
          );
        }
      }
      return ts.visitEachChild(node, visit, context) as ts.Expression;
    }

    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken) &&
      ts.isIdentifier(node.operand)
    ) {
      const binaryOp =
        node.operator === ts.SyntaxKind.PlusPlusToken
          ? ts.SyntaxKind.PlusToken
          : ts.SyntaxKind.MinusToken;
      const one = factory.createNumericLiteral(1);

      const isPrefix = ts.isPrefixUnaryExpression(node);

      if (isPrefix) {
        return factory.createBinaryExpression(
          node.operand,
          ts.SyntaxKind.EqualsToken,
          factory.createBinaryExpression(
            ts.visitNode(node.operand, visit) as ts.Expression,
            binaryOp,
            one,
          ),
        );
      }

      // Postfix: use comma operator (old, new) when embedded in an expression.
      const assignment = factory.createBinaryExpression(
        node.operand,
        ts.SyntaxKind.EqualsToken,
        factory.createBinaryExpression(
          ts.visitNode(node.operand, visit) as ts.Expression,
          binaryOp,
          one,
        ),
      );

      const parent = node.parent;
      if (ts.isExpressionStatement(parent)) {
        return assignment;
      }

      return factory.createBinaryExpression(
        assignment,
        ts.SyntaxKind.CommaToken,
        node.operand,
      );
    }

    return ts.visitEachChild(node, visit, context) as ts.Expression;
  };

  const visit = (node: ts.Node): ts.Node => {
    if (ts.isExpression(node)) {
      return desugarExpression(node);
    }
    return ts.visitEachChild(node, visit, context);
  };

  return (sourceFile) => ts.visitNode(sourceFile, visit) as ts.SourceFile;
}

function equalsToBinaryOp(kind: ts.SyntaxKind): ts.SyntaxKind | undefined {
  switch (kind) {
    case ts.SyntaxKind.PlusEqualsToken:
      return ts.SyntaxKind.PlusToken;
    case ts.SyntaxKind.MinusEqualsToken:
      return ts.SyntaxKind.MinusToken;
    case ts.SyntaxKind.AsteriskEqualsToken:
      return ts.SyntaxKind.AsteriskToken;
    case ts.SyntaxKind.SlashEqualsToken:
      return ts.SyntaxKind.SlashToken;
    case ts.SyntaxKind.PercentEqualsToken:
      return ts.SyntaxKind.PercentToken;
    default:
      return undefined;
  }
}
