export type GraphqlOperationKind = 'query' | 'mutation';

export const GRAPHQL_OPERATION_DECORATOR_NAMES: Record<string, GraphqlOperationKind> = {
  Query: 'query',
  Mutation: 'mutation',
};
