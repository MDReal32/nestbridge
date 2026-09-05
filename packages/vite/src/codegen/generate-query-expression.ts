import type { ControllerParameterDefinition } from '@nestbridge/core';
import { mergeNamedParametersExpression } from './merge-named-parameters-expression';

export const generateQueryExpression = (parameters: readonly ControllerParameterDefinition[]) =>
  mergeNamedParametersExpression(parameters.filter((parameter) => parameter.kind === 'query'));
