import type { ResolverMethodDefinition, SelectionField } from '@nestbridge/core';

const capitalize = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

const renderSelectionSet = (fields: readonly SelectionField[]): string => {
  const rendered = fields.map((field) =>
    field.children === undefined
      ? field.name
      : `${field.name} ${renderSelectionSet(field.children)}`,
  );

  return `{ ${rendered.join(' ')} }`;
};

export const generateGraphqlDocument = (method: ResolverMethodDefinition) => {
  const variableDeclarations = method.arguments
    .map((argument) => `$${argument.name}: ${argument.graphqlType}`)
    .join(', ');
  const fieldArguments = method.arguments
    .map((argument) => `${argument.name}: $${argument.name}`)
    .join(', ');

  const variablesClause = variableDeclarations.length > 0 ? `(${variableDeclarations})` : '';
  const fieldArgumentsClause = fieldArguments.length > 0 ? `(${fieldArguments})` : '';
  const fieldSelection =
    method.selection.length > 0 ? ` ${renderSelectionSet(method.selection)}` : '';

  return `${method.operationKind} ${capitalize(method.name)}${variablesClause} { ${method.operationName}${fieldArgumentsClause}${fieldSelection} }`;
};
