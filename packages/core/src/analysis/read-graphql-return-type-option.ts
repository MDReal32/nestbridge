import type { ArrowFunction, Decorator, FunctionExpression } from 'typescript/unstable/ast';
import {
  isArrayLiteralExpression,
  isArrowFunction,
  isCallExpression,
  isFunctionExpression,
  isIdentifier,
} from 'typescript/unstable/ast';
import { readTypeThunkExpression } from './read-type-thunk-expression';

export const readGraphqlReturnTypeOption = (decorator: Decorator): string | undefined => {
  if (!isCallExpression(decorator.expression)) {
    return undefined;
  }

  const thunk = decorator.expression.arguments.find(
    (argument): argument is ArrowFunction | FunctionExpression =>
      isArrowFunction(argument) || isFunctionExpression(argument),
  );

  if (thunk === undefined) {
    return undefined;
  }

  const returnedExpression = readTypeThunkExpression(thunk);

  if (returnedExpression === undefined) {
    return undefined;
  }

  if (isArrayLiteralExpression(returnedExpression)) {
    const element = returnedExpression.elements[0];
    return element !== undefined && isIdentifier(element) ? element.text : undefined;
  }

  return isIdentifier(returnedExpression) ? returnedExpression.text : undefined;
};
