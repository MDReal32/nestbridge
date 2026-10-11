import type { ControllerMethodDefinition } from '@nestbridge/core';

const PARAM_TOKEN_PATTERN = /:([A-Za-z0-9_]+)/;
const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const generatePropertyAccess = (objectName: string, propertyName: string) =>
  IDENTIFIER_PATTERN.test(propertyName)
    ? `${objectName}.${propertyName}`
    : `${objectName}[${JSON.stringify(propertyName)}]`;

export const generatePathExpression = (method: ControllerMethodDefinition) => {
  const paramParameters = method.parameters.filter((parameter) => parameter.kind === 'param');
  const wholeParameter = paramParameters.find((parameter) => parameter.name === undefined);
  const parts = method.path.split(PARAM_TOKEN_PATTERN);
  const expressionParts: string[] = [];

  const generateTokenExpression = (token: string) => {
    const namedParameter = paramParameters.find((parameter) => parameter.name === token);

    if (namedParameter !== undefined) {
      return `encodeURIComponent(${namedParameter.parameterName})`;
    }

    if (wholeParameter !== undefined) {
      return `encodeURIComponent(${generatePropertyAccess(wholeParameter.parameterName, token)})`;
    }

    return JSON.stringify(`:${token}`);
  };

  parts.forEach((part, index) => {
    const isParamToken = index % 2 === 1;

    if (isParamToken) {
      expressionParts.push(generateTokenExpression(part));
      return;
    }

    if (part.length > 0) {
      expressionParts.push(JSON.stringify(part));
    }
  });

  return expressionParts.length > 0 ? expressionParts.join(' + ') : "''";
};
