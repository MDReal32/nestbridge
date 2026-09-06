import type { ArrowFunction, Expression, FunctionExpression } from 'typescript/unstable/ast';
import { isBlock, isReturnStatement } from 'typescript/unstable/ast';

export const readTypeThunkExpression = (
  thunk: ArrowFunction | FunctionExpression,
): Expression | undefined => {
  if (!isBlock(thunk.body)) {
    return thunk.body;
  }

  const returnStatement = thunk.body.statements.find(isReturnStatement);
  return returnStatement?.expression;
};
