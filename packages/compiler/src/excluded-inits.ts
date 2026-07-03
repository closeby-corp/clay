import * as ts from 'typescript';

/** Form/control factories — `let x = input(...)` must not become page state. */
export const EXCLUDED_FACTORY_NAMES = new Set([
  'input',
  'slider',
  'checkbox',
  'select',
  'radio',
  'textArea',
  'fileUpload',
  'colorPicker',
  'datePicker',
  'dateTimePicker',
  'timePicker',
  'validatedInput',
  'email',
]);

export function isExcludedInitializer(node: ts.Expression | undefined): boolean {
  if (!node) return false;
  if (!ts.isCallExpression(node)) return false;
  const { expression } = node;
  if (ts.isIdentifier(expression)) {
    return EXCLUDED_FACTORY_NAMES.has(expression.text);
  }
  return false;
}
