interface NamedParameterLike {
  name?: string;
  parameterName: string;
}

export const mergeNamedParametersExpression = (parameters: readonly NamedParameterLike[]) => {
  if (parameters.length === 0) {
    return undefined;
  }

  const whole = parameters.find((parameter) => parameter.name === undefined);
  const named = parameters.filter((parameter) => parameter.name !== undefined);
  const namedEntries = named.map(
    (parameter) => `${JSON.stringify(parameter.name)}: ${parameter.parameterName}`,
  );

  if (whole === undefined) {
    return `{ ${namedEntries.join(', ')} }`;
  }

  if (named.length === 0) {
    return whole.parameterName;
  }

  return `{ ...${whole.parameterName}, ${namedEntries.join(', ')} }`;
};
