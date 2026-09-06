import type { ControllerParameterDefinition } from '@nestbridge/core';

export const generateHeadersExpression = (parameters: readonly ControllerParameterDefinition[]) => {
  const headerParameters = parameters.filter((parameter) => parameter.kind === 'header');

  if (headerParameters.length === 0) {
    return undefined;
  }

  const entries = headerParameters.map(
    (parameter) => `${JSON.stringify(parameter.name)}: ${parameter.parameterName}`,
  );

  return `{ ${entries.join(', ')} }`;
};
