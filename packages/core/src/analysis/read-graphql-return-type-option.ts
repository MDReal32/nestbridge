import ts from 'typescript';
import { readTypeThunkExpression } from './read-type-thunk-expression';

export const readGraphqlReturnTypeOption = (decorator: ts.Decorator): string | undefined => {
  if (!ts.isCallExpression(decorator.expression)) {
    return undefined;
  }

  const thunk = decorator.expression.arguments.find(
    (argument): argument is ts.ArrowFunction | ts.FunctionExpression =>
      ts.isArrowFunction(argument) || ts.isFunctionExpression(argument),
  );

  if (thunk === undefined) {
    return undefined;
  }

  const returnedExpression = readTypeThunkExpression(thunk);

  if (returnedExpression === undefined) {
    return undefined;
  }

  if (ts.isArrayLiteralExpression(returnedExpression)) {
    const element = returnedExpression.elements[0];
    return element !== undefined && ts.isIdentifier(element) ? element.text : undefined;
  }

  return ts.isIdentifier(returnedExpression) ? returnedExpression.text : undefined;
};
