import type { GraphqlOperationKind } from './graphql-operation-kind';
import type { ResolverArgumentDefinition } from './resolver-argument-definition';
import type { SelectionField } from './selection-field';

export interface ResolverMethodDefinition {
  name: string;
  operationKind: GraphqlOperationKind;
  operationName: string;
  arguments: ResolverArgumentDefinition[];
  selection: SelectionField[];
  line: number;
  column: number;
}
