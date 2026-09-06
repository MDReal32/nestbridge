import type {
  Decorator,
  ObjectLiteralExpression,
  PropertyAssignment,
} from 'typescript/unstable/ast';
import {
  isArrowFunction,
  isCallExpression,
  isFunctionExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isStringLiteralLikeNode,
} from 'typescript/unstable/ast';

export interface ReadGraphqlOperationNameResult {
  ok: boolean;
  value?: string;
  argumentText?: string;
}

const readNameFromOptions = (optionsArgument: ObjectLiteralExpression) => {
  const nameProperty = optionsArgument.properties.find(
    (property): property is PropertyAssignment =>
      isPropertyAssignment(property) &&
      isIdentifier(property.name) &&
      property.name.text === 'name',
  );

  if (nameProperty === undefined || !isStringLiteralLikeNode(nameProperty.initializer)) {
    return undefined;
  }

  return nameProperty.initializer.text;
};

export const readGraphqlOperationName = (decorator: Decorator): ReadGraphqlOperationNameResult => {
  const expression = decorator.expression;

  if (!isCallExpression(expression)) {
    return { ok: true, value: undefined };
  }

  let value: string | undefined;

  for (const argument of expression.arguments) {
    if (isArrowFunction(argument) || isFunctionExpression(argument)) {
      continue;
    }

    if (isStringLiteralLikeNode(argument)) {
      value = argument.text;
      continue;
    }

    if (isObjectLiteralExpression(argument)) {
      value = readNameFromOptions(argument) ?? value;
      continue;
    }

    return { ok: false, argumentText: argument.getText() };
  }

  return { ok: true, value };
};
