import type { ControllerParameterDefinition } from '@nestbridge/core';

export const generateParameterList = (parameters: readonly ControllerParameterDefinition[]) =>
  [...parameters]
    .sort((a, b) => a.index - b.index)
    .map((parameter) => parameter.parameterName)
    .join(', ');
