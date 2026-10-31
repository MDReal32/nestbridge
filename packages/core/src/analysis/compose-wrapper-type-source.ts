import { WRAPPED_RESULT_SUBSTITUTION } from '../models/response-wrapper-substitution';
import type { InterceptorShape } from './interceptor-shape';
import { synthesizeGenericObjectType } from './synthesize-generic-object-type';

/**
 * `shapes` run outermost first, so the type is built from the innermost interceptor outward,
 * starting at the awaited server result. Returns `undefined` when no interceptor changes the
 * shape.
 */
export const composeWrapperTypeSource = (shapes: readonly InterceptorShape[]) => {
  const operations = [...shapes].reverse().flatMap((shape) => shape.operations);

  if (operations.length === 0) {
    return undefined;
  }

  let typeSource = WRAPPED_RESULT_SUBSTITUTION;

  for (const operation of operations) {
    const synthesis = synthesizeGenericObjectType(
      operation.returnExpression,
      operation.parameterName,
      typeSource,
    );

    if (!synthesis.ok) {
      throw new Error(
        `[nestbridge] An interceptor shape that was validated can no longer be typed: ${synthesis.reason}`,
      );
    }

    typeSource = synthesis.typeSource;
  }

  return typeSource;
};
