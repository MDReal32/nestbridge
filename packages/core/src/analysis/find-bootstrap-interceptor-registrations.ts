import type { CallExpression, Node, SourceFile } from 'typescript/unstable/ast';
import {
  isCallExpression,
  isIdentifier,
  isNewExpression,
  isPropertyAccessExpression,
} from 'typescript/unstable/ast';
import type { InterceptorRegistrations } from './interceptor-registrations';

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
 * Returned in registration order: `useGlobalInterceptors` concatenates onto a single global
 * list, so a later call (or a later argument within one call) registers an interceptor that wraps
 * closer to the raw handler result.
 */
export const findBootstrapInterceptorRegistrations = (
  sourceFile: SourceFile,
  filePath: string,
): InterceptorRegistrations => {
  const calls: CallExpression[] = [];
  collectUseGlobalInterceptorsCalls(sourceFile, calls);

  const registrations: InterceptorRegistrations = { references: [], problems: [] };

  for (const call of calls) {
    for (const argument of call.arguments) {
      if (isNewExpression(argument) && isIdentifier(argument.expression)) {
        registrations.references.push({
          className: argument.expression.text,
          node: argument,
          sourceFile,
          filePath,
        });
        continue;
      }

      registrations.problems.push({
        node: argument,
        sourceFile,
        filePath,
        detail:
          'Global interceptors must be registered as `new InterceptorClass()` to be analyzed.',
      });
    }
  }

  return registrations;
};
