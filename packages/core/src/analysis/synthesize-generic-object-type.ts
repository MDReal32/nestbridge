import type { Expression, ObjectLiteralExpression } from 'typescript/unstable/ast';
import {
  isFalseLiteral,
  isIdentifier,
  isNullLiteral,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isStringLiteral,
  isTrueLiteral,
} from 'typescript/unstable/ast';

interface SynthesisState {
  substitutionCount: number;
}

const synthesizeExpressionType = (
  expression: Expression,
  parameterName: string,
  substitution: string,
  state: SynthesisState,
) => {
  if (isIdentifier(expression) && expression.text === parameterName) {
    state.substitutionCount += 1;
    return substitution;
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

      const valueType = synthesizeExpressionType(
        property.initializer,
        parameterName,
        substitution,
        state,
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

  return undefined;
};

export const synthesizeGenericObjectType = (
  objectLiteral: ObjectLiteralExpression,
  parameterName: string,
  substitution: string,
) => {
  const state: SynthesisState = { substitutionCount: 0 };
  const objectType = synthesizeExpressionType(objectLiteral, parameterName, substitution, state);

  return objectType !== undefined && state.substitutionCount === 1 ? objectType : undefined;
};
