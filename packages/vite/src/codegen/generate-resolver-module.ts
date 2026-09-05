import type {
  ResolverArgumentDefinition,
  ResolverDefinition,
  ResolverMethodDefinition,
} from '@nestbridge/core';
import { generateGraphqlDocument } from './generate-graphql-document';
import { generateResolverArgumentList } from './generate-resolver-argument-list';

const generateVariablesExpression = (resolverArguments: readonly ResolverArgumentDefinition[]) => {
  if (resolverArguments.length === 0) {
    return undefined;
  }

  const entries = resolverArguments.map(
    (argument) => `${JSON.stringify(argument.name)}: ${argument.parameterName}`,
  );

  return `{ ${entries.join(', ')} }`;
};

const generateMethod = (method: ResolverMethodDefinition) => {
  const requestProperties = [`document: ${JSON.stringify(generateGraphqlDocument(method))}`];

  const variablesExpression = generateVariablesExpression(method.arguments);
  if (variablesExpression !== undefined) {
    requestProperties.push(`variables: ${variablesExpression}`);
  }

  return [
    `  async ${method.name}(${generateResolverArgumentList(method.arguments)}) {`,
    '    const result = await graphqlRequest({',
    ...requestProperties.map((property) => `      ${property},`),
    '    });',
    '',
    `    return result.${method.operationName};`,
    '  }',
  ].join('\n');
};

export const generateResolverModule = (resolver: ResolverDefinition) => {
  const methods = resolver.methods.map(generateMethod).join('\n\n');

  return [
    "import { graphqlRequest } from '@nestbridge/runtime';",
    '',
    `export class ${resolver.name} {`,
    '  constructor() {}',
    '',
    methods,
    '}',
    '',
  ].join('\n');
};
