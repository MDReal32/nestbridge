import type { Expression } from 'typescript/unstable/ast';
import {
  isArrayLiteralExpression,
  isIdentifier,
  isStringLiteralLikeNode,
} from 'typescript/unstable/ast';

const VERSION_NEUTRAL_NAME = 'VERSION_NEUTRAL';

const readSingleRouteVersion = (expression: Expression) => {
  if (isStringLiteralLikeNode(expression)) {
    return { ok: true as const, version: expression.text };
  }

  if (isIdentifier(expression) && expression.text === VERSION_NEUTRAL_NAME) {
    return { ok: true as const, version: null };
  }

  return { ok: false as const, argumentText: expression.getText() };
};

/**
 * An array of versions registers the route once per version, so any one of them is a valid URL;
 * the first is used.
 */
export const readRouteVersion = (expression: Expression) => {
  if (!isArrayLiteralExpression(expression)) {
    return readSingleRouteVersion(expression);
  }

  const [firstElement] = expression.elements;

  return firstElement === undefined
    ? { ok: false as const, argumentText: expression.getText() }
    : readSingleRouteVersion(firstElement);
};
