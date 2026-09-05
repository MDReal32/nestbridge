import ts from 'typescript';
import { readTypeThunkExpression } from './read-type-thunk-expression';

export interface ArgsTypeOption {
  typeName: string;
  isArray: boolean;
}

export const readArgsTypeOption = (decorator: ts.Decorator): ArgsTypeOption | undefined => {
  if (!ts.isCallExpression(decorator.expression)) {
    return undefined;
  }

  const optionsArgument = decorator.expression.arguments.find(ts.isObjectLiteralExpression);

  if (optionsArgument === undefined) {
    return undefined;
  }

  const typeProperty = optionsArgument.properties.find(
    (property): property is ts.PropertyAssignment =>
      ts.isPropertyAssignment(property) &&
      ts.isIdentifier(property.name) &&
      property.name.text === 'type',
  );

  if (typeProperty === undefined) {
    return undefined;
  }

  const thunk = typeProperty.initializer;

  if (!ts.isArrowFunction(thunk) && !ts.isFunctionExpression(thunk)) {
    return undefined;
  }

  const returnedExpression = readTypeThunkExpression(thunk);

  if (returnedExpression === undefined) {
    return undefined;
  }

  if (ts.isArrayLiteralExpression(returnedExpression)) {
    const element = returnedExpression.elements[0];
    return element !== undefined && ts.isIdentifier(element)
      ? { typeName: element.text, isArray: true }
      : undefined;
  }

  return ts.isIdentifier(returnedExpression)
    ? { typeName: returnedExpression.text, isArray: false }
    : undefined;
};
