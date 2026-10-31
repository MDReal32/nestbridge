import type { Expression, SourceFile } from 'typescript/unstable/ast';
import { isCallExpression, isIdentifier } from 'typescript/unstable/ast';
import { readMapOperation } from './read-map-operation';
import { findImportSource } from './resolve-type-declaration';

const RXJS_MODULE_SPECIFIERS = ['rxjs', 'rxjs/operators'];
const MAP_OPERATOR_NAME = 'map';
const SHAPE_NEUTRAL_OPERATOR_NAMES = ['tap', 'timeout', 'finalize'];

export const readPipeOperator = (operator: Expression, sourceFile: SourceFile) => {
  if (!isCallExpression(operator) || !isIdentifier(operator.expression)) {
    return {
      ok: false,
      node: operator,
      reason: 'Pipe operators must be calls of operators imported by name from rxjs.',
    } as const;
  }

  const importSource = findImportSource(sourceFile, operator.expression.text);

  if (
    importSource === undefined ||
    !RXJS_MODULE_SPECIFIERS.includes(importSource.moduleSpecifierText)
  ) {
    return {
      ok: false,
      node: operator,
      reason: `Operator \`${operator.expression.text}\` is not imported from rxjs, so its effect on the response shape is unknown.`,
    } as const;
  }

  if (importSource.importedName === MAP_OPERATOR_NAME) {
    return readMapOperation(operator);
  }

  if (SHAPE_NEUTRAL_OPERATOR_NAMES.includes(importSource.importedName)) {
    return { ok: true, operation: undefined } as const;
  }

  return {
    ok: false,
    node: operator,
    reason: `Operator \`${importSource.importedName}\` changes or hides the response shape.`,
  } as const;
};
