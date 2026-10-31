import type { Expression } from 'typescript/unstable/ast';
import { isParenthesizedExpression } from 'typescript/unstable/ast';

export const unwrapParenthesizedExpression = (expression: Expression) => {
  let unwrapped = expression;

  while (isParenthesizedExpression(unwrapped)) {
    unwrapped = unwrapped.expression;
  }

  return unwrapped;
};
