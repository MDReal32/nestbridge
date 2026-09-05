import type { ResolverMethodDefinition } from './resolver-method-definition';

export interface ResolverDefinition {
  name: string;
  sourceFile: string;
  methods: ResolverMethodDefinition[];
}
