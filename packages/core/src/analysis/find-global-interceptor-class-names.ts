import type { CallExpression, Node, SourceFile } from 'typescript/unstable/ast';
import {
  isCallExpression,
  isIdentifier,
  isNewExpression,
  isPropertyAccessExpression,
} from 'typescript/unstable/ast';

const USE_GLOBAL_INTERCEPTORS_METHOD_NAME = 'useGlobalInterceptors';

const collectUseGlobalInterceptorsCalls = (node: Node, calls: CallExpression[]) => {
  if (
    isCallExpression(node) &&
    isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === USE_GLOBAL_INTERCEPTORS_METHOD_NAME
  ) {
    calls.push(node);
  }

  node.forEachChild((child) => {
    collectUseGlobalInterceptorsCalls(child, calls);
    return undefined;
  });
};

/**
 * Returned in registration order: `useGlobalInterceptors` concatenates onto a
 * single global list, so a later call (or a later argument within one call)
 * always registers an interceptor that wraps closer to the raw handler result.
 */
export const findGlobalInterceptorClassNames = (sourceFile: SourceFile) => {
  const calls: CallExpression[] = [];
  collectUseGlobalInterceptorsCalls(sourceFile, calls);

  if (calls.length === 0) {
    return undefined;
  }

  const classNames: string[] = [];

  for (const call of calls) {
    for (const argument of call.arguments) {
      if (!isNewExpression(argument) || !isIdentifier(argument.expression)) {
        return undefined;
      }

      classNames.push(argument.expression.text);
    }
  }

  return classNames.length === 0 ? undefined : classNames;
};
