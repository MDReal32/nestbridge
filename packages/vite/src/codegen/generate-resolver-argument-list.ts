import type { ResolverArgumentDefinition } from '@nestbridge/core';

export const generateResolverArgumentList = (
  resolverArguments: readonly ResolverArgumentDefinition[],
) =>
  [...resolverArguments]
    .sort((a, b) => a.index - b.index)
    .map((argument) => argument.parameterName)
    .join(', ');
