import type { Decorator, PropertyAssignment } from 'typescript/unstable/ast';
import {
  isArrayLiteralExpression,
  isArrowFunction,
  isCallExpression,
  isFunctionExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAssignment,
} from 'typescript/unstable/ast';
import { readTypeThunkExpression } from './read-type-thunk-expression';

export interface ArgsTypeOption {
  typeName: string;
  isArray: boolean;
}

export const readArgsTypeOption = (decorator: Decorator): ArgsTypeOption | undefined => {
  if (!isCallExpression(decorator.expression)) {
    return undefined;
  }

  const optionsArgument = decorator.expression.arguments.find(isObjectLiteralExpression);

  if (optionsArgument === undefined) {
    return undefined;
  }

  const typeProperty = optionsArgument.properties.find(
    (property): property is PropertyAssignment =>
      isPropertyAssignment(property) &&
      isIdentifier(property.name) &&
      property.name.text === 'type',
  );

  if (typeProperty === undefined) {
    return undefined;
  }

  const thunk = typeProperty.initializer;

  if (!isArrowFunction(thunk) && !isFunctionExpression(thunk)) {
    return undefined;
  }

  const returnedExpression = readTypeThunkExpression(thunk);

  if (returnedExpression === undefined) {
    return undefined;
  }

  if (isArrayLiteralExpression(returnedExpression)) {
    const element = returnedExpression.elements[0];
    return element !== undefined && isIdentifier(element)
      ? { typeName: element.text, isArray: true }
      : undefined;
  }

  return isIdentifier(returnedExpression)
    ? { typeName: returnedExpression.text, isArray: false }
    : undefined;
};
