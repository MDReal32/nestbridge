import type { CallExpression, Node, SourceFile } from 'typescript/unstable/ast';
import {
  isCallExpression,
  isIdentifier,
  isNewExpression,
  isPropertyAccessExpression,
} from 'typescript/unstable/ast';

const USE_GLOBAL_FILTERS_METHOD_NAME = 'useGlobalFilters';

const collectUseGlobalFiltersCalls = (node: Node, calls: CallExpression[]) => {
  if (
    isCallExpression(node) &&
    isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === USE_GLOBAL_FILTERS_METHOD_NAME
  ) {
    calls.push(node);
  }

  node.forEachChild((child) => {
    collectUseGlobalFiltersCalls(child, calls);
    return undefined;
  });
};

export const findGlobalFilterClassName = (sourceFile: SourceFile) => {
  const calls: CallExpression[] = [];
  collectUseGlobalFiltersCalls(sourceFile, calls);

  if (calls.length === 0) {
    return undefined;
  }

  const classNames = new Set<string>();

  for (const call of calls) {
    for (const argument of call.arguments) {
      if (!isNewExpression(argument) || !isIdentifier(argument.expression)) {
        return undefined;
      }

      classNames.add(argument.expression.text);
    }
  }

  return classNames.size === 1 ? [...classNames][0] : undefined;
};
