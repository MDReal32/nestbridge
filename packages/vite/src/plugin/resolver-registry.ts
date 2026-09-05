import {
  analyzeResolvers,
  type NestBridgeDiagnostic,
  type ResolverDefinition,
} from '@nestbridge/core';
import { normalizePath } from 'vite';
import { discoverFiles } from '../discovery';

export interface ResolverRegistryRefreshResult {
  resolvers: ResolverDefinition[];
  diagnostics: NestBridgeDiagnostic[];
}

export interface ResolverRegistry {
  refresh: () => ResolverRegistryRefreshResult;
  get: (filePath: string) => ResolverDefinition | undefined;
  has: (filePath: string) => boolean;
  all: () => ResolverDefinition[];
}

export const createResolverRegistry = (
  patterns: readonly string[],
  root: string,
): ResolverRegistry => {
  const resolversByFile = new Map<string, ResolverDefinition>();

  const refresh = () => {
    resolversByFile.clear();

    const files = discoverFiles(patterns, root);
    const { resolvers, diagnostics } = analyzeResolvers(files);

    for (const resolver of resolvers) {
      resolversByFile.set(normalizePath(resolver.sourceFile), resolver);
    }

    return { resolvers, diagnostics };
  };

  return {
    refresh,
    get: (filePath) => resolversByFile.get(filePath),
    has: (filePath) => resolversByFile.has(filePath),
    all: () => [...resolversByFile.values()],
  };
};
