import ts from 'typescript';

export const readTypeThunkExpression = (
  thunk: ts.ArrowFunction | ts.FunctionExpression,
): ts.Expression | undefined => {
  if (!ts.isBlock(thunk.body)) {
    return thunk.body;
  }

  const returnStatement = thunk.body.statements.find(ts.isReturnStatement);
  return returnStatement?.expression;
};
