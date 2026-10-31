import type { Expression, Node, ObjectLiteralExpression } from 'typescript/unstable/ast';
import {
  isBinaryExpression,
  isFalseLiteral,
  isIdentifier,
  isNullLiteral,
  isNumericLiteral,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isPropertyAssignment,
  isShorthandPropertyAssignment,
  isStringLiteral,
  isTrueLiteral,
  SyntaxKind,
} from 'typescript/unstable/ast';

interface SynthesisFailure {
  node: Node;
  reason: string;
}

interface SynthesisState {
  substitutionCount: number;
  failure?: SynthesisFailure;
}

const NUMERIC_OPERATOR_KINDS: readonly SyntaxKind[] = [
  SyntaxKind.MinusToken,
  SyntaxKind.AsteriskToken,
  SyntaxKind.SlashToken,
  SyntaxKind.PercentToken,
];

const fail = (state: SynthesisState, node: Node, reason: string) => {
  state.failure ??= { node, reason };
  return undefined;
};

const describeUntypedExpression = (expression: Expression) =>
  isBinaryExpression(expression) && expression.operatorToken.kind === SyntaxKind.PlusToken
    ? `\`${expression.getText()}\` can be a string or a number, so its type is not guessed.`
    : `The type of \`${expression.getText()}\` cannot be determined statically.`;

const synthesizeExpressionType = (
  expression: Expression,
  parameterName: string,
  substitution: string,
  state: SynthesisState,
) => {
  if (isParenthesizedExpression(expression)) {
    return synthesizeExpressionType(expression.expression, parameterName, substitution, state);
  }

  if (isIdentifier(expression) && expression.text === parameterName) {
    state.substitutionCount += 1;
    return substitution;
  }

  if (isObjectLiteralExpression(expression)) {
    const memberTypes: string[] = [];

    for (const property of expression.properties) {
      if (isShorthandPropertyAssignment(property)) {
        const shorthandName = property.name.getText();

        if (shorthandName !== parameterName) {
          return fail(
            state,
            property,
            `The type of \`${shorthandName}\` cannot be determined statically.`,
          );
        }

        state.substitutionCount += 1;
        memberTypes.push(`${shorthandName}: ${substitution}`);
        continue;
      }

      if (
        !isPropertyAssignment(property) ||
        !(isIdentifier(property.name) || isStringLiteral(property.name))
      ) {
        return fail(
          state,
          property,
          `\`${property.getText()}\` is not a plain \`name: value\` property.`,
        );
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

  if (
    isBinaryExpression(expression) &&
    NUMERIC_OPERATOR_KINDS.includes(expression.operatorToken.kind)
  ) {
    return 'number';
  }

  return fail(state, expression, describeUntypedExpression(expression));
};

export const synthesizeGenericObjectType = (
  objectLiteral: ObjectLiteralExpression,
  parameterName: string,
  substitution: string,
) => {
  const state: SynthesisState = { substitutionCount: 0 };
  const objectType = synthesizeExpressionType(objectLiteral, parameterName, substitution, state);

  if (objectType === undefined) {
    const failure = state.failure ?? {
      node: objectLiteral,
      reason: `The type of \`${objectLiteral.getText()}\` cannot be determined statically.`,
    };

    return { ok: false, node: failure.node, reason: failure.reason } as const;
  }

  if (state.substitutionCount !== 1) {
    return {
      ok: false,
      node: objectLiteral,
      reason:
        `The payload parameter \`${parameterName}\` must appear exactly once in the returned ` +
        `object, but appears ${state.substitutionCount} times.`,
    } as const;
  }

  return { ok: true, typeSource: objectType } as const;
};
