import type { Expression, MethodDeclaration } from 'typescript/unstable/ast';
import {
  isCallExpression,
  isExpressionStatement,
  isIdentifier,
  isPropertyAccessExpression,
  isReturnStatement,
  isVariableStatement,
} from 'typescript/unstable/ast';

export interface CatchMethodBodyResolution {
  exceptionParameterName: string;
  localDeclarations: Map<string, Expression>;
  responseBodyArgument: Expression;
}

const RESPONSE_BODY_CALL_NAMES = new Set(['json', 'send']);

const matchResponseBodyArgument = (expression: Expression) => {
  if (
    !isCallExpression(expression) ||
    !isPropertyAccessExpression(expression.expression) ||
    !RESPONSE_BODY_CALL_NAMES.has(expression.expression.name.text) ||
    expression.arguments.length !== 1
  ) {
    return undefined;
  }

  const [argument] = expression.arguments;
  return argument;
};

export const resolveCatchMethodBody = (
  catchMethod: MethodDeclaration,
): CatchMethodBodyResolution | undefined => {
  const [exceptionParameter] = catchMethod.parameters;

  if (exceptionParameter === undefined || !isIdentifier(exceptionParameter.name)) {
    return undefined;
  }

  const body = catchMethod.body;

  if (body === undefined) {
    return undefined;
  }

  const localDeclarations = new Map<string, Expression>();
  let responseBodyArgument: Expression | undefined;
  let sawResponseCall = false;
  let sawTrailingReturn = false;

  for (const statement of body.statements) {
    if (sawTrailingReturn) {
      return undefined;
    }

    if (!sawResponseCall && isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!isIdentifier(declaration.name) || declaration.initializer === undefined) {
          return undefined;
        }

        localDeclarations.set(declaration.name.text, declaration.initializer);
      }

      continue;
    }

    if (!sawResponseCall && isExpressionStatement(statement)) {
      const argument = matchResponseBodyArgument(statement.expression);

      if (argument === undefined) {
        return undefined;
      }

      responseBodyArgument = argument;
      sawResponseCall = true;
      continue;
    }

    if (sawResponseCall && isReturnStatement(statement) && statement.expression === undefined) {
      sawTrailingReturn = true;
      continue;
    }

    return undefined;
  }

  if (!sawResponseCall || responseBodyArgument === undefined) {
    return undefined;
  }

  return {
    exceptionParameterName: exceptionParameter.name.text,
    localDeclarations,
    responseBodyArgument,
  };
};
