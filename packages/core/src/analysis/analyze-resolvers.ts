import { readFileSync } from 'node:fs';
import ts from 'typescript';
import type { NestBridgeDiagnostic } from '../diagnostics';
import type { ResolverDefinition } from '../models';
import { extractResolverDefinition } from './extract-resolver-definition';
import { findResolverClasses } from './find-resolver-classes';

export const analyzeResolvers = (filePaths: readonly string[]) => {
  const diagnostics: NestBridgeDiagnostic[] = [];
  const resolvers: ResolverDefinition[] = [];

  for (const filePath of filePaths) {
    const content = readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );

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
