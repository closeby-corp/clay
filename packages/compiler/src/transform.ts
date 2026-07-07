import * as ts from 'typescript';
import { collectGlobalStateBindings, collectReactiveBindings, getPageCallback, hasStateParam, isPageCall } from './collect-reactive';
import { createDesugarTransformer } from './desugar';
import { createPageTransformer } from './rewrite';

export function shouldTransformSource(source: string): boolean {
  return /\bpage\s*\(/.test(source) || /\bui\.page\s*\(/.test(source);
}

function needsTransform(sourceFile: ts.SourceFile): boolean {
  let found = false;

  const visit = (node: ts.Node) => {
    if (isPageCall(node)) {
      const callback = getPageCallback(node);
      if (callback && !hasStateParam(callback.parameters)) {
        const hasReactive = collectReactiveBindings(callback.body).length > 0;
        const hasGlobal = collectGlobalStateBindings(callback.body).size > 0;
        if (hasReactive || hasGlobal) {
          found = true;
        }
      }
    }
    if (!found) {
      ts.forEachChild(node, visit);
    }
  };

  visit(sourceFile);
  return found;
}

export function transformSource(source: string, fileName: string): string {
  if (!shouldTransformSource(source)) {
    return source;
  }

  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  if (!needsTransform(sourceFile)) {
    return source;
  }

  const result = ts.transform(sourceFile, [createDesugarTransformer, createPageTransformer]);
  const transformed = result.transformed[0] as ts.SourceFile;

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const output = printer.printFile(transformed);

  result.dispose();
  return output;
}
