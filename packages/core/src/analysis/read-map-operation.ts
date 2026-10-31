import type { CallExpression } from 'typescript/unstable/ast';
import {
  isArrowFunction,
  isFunctionExpression,
  isIdentifier,
  isObjectLiteralExpression,
} from 'typescript/unstable/ast';
import { WRAPPED_RESULT_SUBSTITUTION } from '../models/response-wrapper-substitution';
import { resolveSoleReturnExpression } from './resolve-sole-return-expression';
import { synthesizeGenericObjectType } from './synthesize-generic-object-type';

export const readMapOperation = (operator: CallExpression) => {
  const [callback] = operator.arguments;

  if (
    operator.arguments.length !== 1 ||
    callback === undefined ||
    !(isArrowFunction(callback) || isFunctionExpression(callback))
  ) {
    return {
      ok: false,
      node: operator,
      reason: 'The `map` operator must take a single arrow or function expression.',
    } as const;
  }

  const [parameter] = callback.parameters;

  if (
    callback.parameters.length !== 1 ||
    parameter === undefined ||
    !isIdentifier(parameter.name)
  ) {
    return {
      ok: false,
      node: callback,
      reason: 'The `map` callback must take exactly one plain parameter.',
    } as const;
  }

  const returnExpression = resolveSoleReturnExpression(callback.body);

  if (returnExpression === undefined || !isObjectLiteralExpression(returnExpression)) {
    return {
      ok: false,
      node: callback,
      reason: 'The `map` callback must return an object literal.',
    } as const;
  }

  const synthesis = synthesizeGenericObjectType(
    returnExpression,
    parameter.name.text,
    WRAPPED_RESULT_SUBSTITUTION,
  );

  if (!synthesis.ok) {
    return { ok: false, node: synthesis.node, reason: synthesis.reason } as const;
  }

  return {
    ok: true,
    operation: { parameterName: parameter.name.text, returnExpression },
  } as const;
};
