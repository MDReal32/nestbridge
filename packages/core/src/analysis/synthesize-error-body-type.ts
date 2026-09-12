import type { Expression, ObjectLiteralExpression } from 'typescript/unstable/ast';
import {
  isCallExpression,
  isFalseLiteral,
  isIdentifier,
  isNullLiteral,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isStringLiteral,
  isTrueLiteral,
} from 'typescript/unstable/ast';

const EXCEPTION_MESSAGE_MEMBER_NAME = 'message';
const EXCEPTION_STATUS_METHOD_NAME = 'getStatus';

const resolvesToExceptionParameter = (
  expression: Expression,
  exceptionParameterName: string,
  localDeclarations: ReadonlyMap<string, Expression>,
  visited: Set<string>,
): boolean => {
  if (!isIdentifier(expression)) {
    return false;
  }

  if (expression.text === exceptionParameterName) {
    return true;
  }

  if (visited.has(expression.text)) {
    return false;
  }

  visited.add(expression.text);

  const aliasedExpression = localDeclarations.get(expression.text);

  return aliasedExpression !== undefined
    ? resolvesToExceptionParameter(
        aliasedExpression,
        exceptionParameterName,
        localDeclarations,
        visited,
      )
    : false;
};

const synthesizeErrorValueType = (
  expression: Expression,
  exceptionParameterName: string,
  localDeclarations: ReadonlyMap<string, Expression>,
): string | undefined => {
  if (
    isPropertyAccessExpression(expression) &&
    expression.name.text === EXCEPTION_MESSAGE_MEMBER_NAME &&
    resolvesToExceptionParameter(
      expression.expression,
      exceptionParameterName,
      localDeclarations,
      new Set(),
    )
  ) {
    return 'string';
  }

  if (
    isCallExpression(expression) &&
    expression.arguments.length === 0 &&
    isPropertyAccessExpression(expression.expression) &&
    expression.expression.name.text === EXCEPTION_STATUS_METHOD_NAME &&
    resolvesToExceptionParameter(
      expression.expression.expression,
      exceptionParameterName,
      localDeclarations,
      new Set(),
    )
  ) {
    return 'number';
  }

  if (isObjectLiteralExpression(expression)) {
    const memberTypes: string[] = [];

    for (const property of expression.properties) {
      if (
        !isPropertyAssignment(property) ||
        !(isIdentifier(property.name) || isStringLiteral(property.name))
      ) {
        return undefined;
      }

      const valueType = synthesizeErrorValueType(
        property.initializer,
        exceptionParameterName,
        localDeclarations,
      );

      if (valueType === undefined) {
        return undefined;
      }

      memberTypes.push(`${property.name.text}: ${valueType}`);
    }

    return `{ ${memberTypes.join('; ')} }`;
  }

  if (isStringLiteral(expression)) {
    return 'string';
  }

  if (isNumericLiteral(expression)) {
    return 'number';
  }

  if (isTrueLiteral(expression) || isFalseLiteral(expression)) {
    return 'boolean';
  }

  if (isNullLiteral(expression)) {
    return 'null';
  }

  if (isIdentifier(expression)) {
    const aliasedExpression = localDeclarations.get(expression.text);

    return aliasedExpression !== undefined
      ? synthesizeErrorValueType(aliasedExpression, exceptionParameterName, localDeclarations)
      : undefined;
  }

  return undefined;
};

export const synthesizeErrorBodyType = (
  objectLiteral: ObjectLiteralExpression,
  exceptionParameterName: string,
  localDeclarations: ReadonlyMap<string, Expression>,
) => synthesizeErrorValueType(objectLiteral, exceptionParameterName, localDeclarations);
