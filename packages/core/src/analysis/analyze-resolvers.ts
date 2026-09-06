import type { NestBridgeDiagnostic } from '../diagnostics';
import type { ResolverDefinition } from '../models';
import { extractResolverDefinition } from './extract-resolver-definition';
import { findResolverClasses } from './find-resolver-classes';
import { parseSourceFile } from './parse-source-file';

export const analyzeResolvers = (
  filePaths: readonly string[],
): { resolvers: ResolverDefinition[]; diagnostics: NestBridgeDiagnostic[] } => {
  const diagnostics: NestBridgeDiagnostic[] = [];
  const resolvers: ResolverDefinition[] = [];

  for (const filePath of filePaths) {
    const sourceFile = parseSourceFile(filePath);

    for (const classDeclaration of findResolverClasses(sourceFile)) {
      const resolver = extractResolverDefinition(
        classDeclaration,
        sourceFile,
        filePath,
        diagnostics,
      );

      if (resolver !== undefined) {
        resolvers.push(resolver);
      }
    }
  }

  return { resolvers, diagnostics };
};
