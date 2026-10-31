import type { Expression, MethodDeclaration, SourceFile } from 'typescript/unstable/ast';
import {
  isCallExpression,
  isIdentifier,
  isPropertyAccessExpression,
} from 'typescript/unstable/ast';
import type { InterceptorShape } from './interceptor-shape';
import type { MapOperation } from './map-operation';
import { readPipeOperator } from './read-pipe-operator';
import { resolveInterceptReturnExpression } from './resolve-intercept-return-expression';

const HANDLE_MEMBER_NAME = 'handle';
const PIPE_MEMBER_NAME = 'pipe';
const CALL_HANDLER_PARAMETER_INDEX = 1;

const isHandleCall = (expression: Expression, callHandlerName: string) =>
  isCallExpression(expression) &&
  expression.arguments.length === 0 &&
  isPropertyAccessExpression(expression.expression) &&
  expression.expression.name.text === HANDLE_MEMBER_NAME &&
  isIdentifier(expression.expression.expression) &&
  expression.expression.expression.text === callHandlerName;

export const analyzeInterceptMethod = (method: MethodDeclaration, sourceFile: SourceFile) => {
  const callHandler = method.parameters[CALL_HANDLER_PARAMETER_INDEX];

  if (method.body === undefined || callHandler === undefined || !isIdentifier(callHandler.name)) {
    return {
      ok: false,
      node: method,
      reason: 'intercept() must have a body and name its CallHandler parameter.',
    } as const;
  }

  const returned = resolveInterceptReturnExpression(method.body);

  if (!returned.ok) {
    return returned;
  }

  const callHandlerName = callHandler.name.text;
  const expression = returned.expression;

  if (isHandleCall(expression, callHandlerName)) {
    const shape: InterceptorShape = { operations: [] };
    return { ok: true, shape } as const;
  }

  if (
    !isCallExpression(expression) ||
    !isPropertyAccessExpression(expression.expression) ||
    expression.expression.name.text !== PIPE_MEMBER_NAME ||
    !isHandleCall(expression.expression.expression, callHandlerName)
  ) {
    return {
      ok: false,
      node: expression,
      reason: `intercept() must return \`${callHandlerName}.handle()\`, optionally piped through rxjs operators.`,
    } as const;
  }

  const operations: MapOperation[] = [];

  for (const operator of expression.arguments) {
    const read = readPipeOperator(operator, sourceFile);

    if (!read.ok) {
      return read;
    }

    if (read.operation !== undefined) {
      operations.push(read.operation);
    }
  }

  const shape: InterceptorShape = { operations };
  return { ok: true, shape } as const;
};
