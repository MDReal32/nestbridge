import type { ControllerMethodDefinition } from '@nestbridge/core';

const PARAM_TOKEN_PATTERN = /:([A-Za-z0-9_]+)/;

export const generatePathExpression = (method: ControllerMethodDefinition) => {
  const paramParameters = method.parameters.filter((parameter) => parameter.kind === 'param');
  const parts = method.path.split(PARAM_TOKEN_PATTERN);
  const expressionParts: string[] = [];

  parts.forEach((part, index) => {
    const isParamToken = index % 2 === 1;

    if (!isParamToken) {
      if (part.length > 0) {
        expressionParts.push(JSON.stringify(part));
      }
      return;
    }

    const match = paramParameters.find((parameter) => parameter.name === part);
    expressionParts.push(
      match !== undefined
        ? `encodeURIComponent(${match.parameterName})`
        : JSON.stringify(`:${part}`),
    );
  });

  return expressionParts.length > 0 ? expressionParts.join(' + ') : "''";
};
