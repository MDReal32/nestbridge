import ts from 'typescript';
import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';
import { extractResolverMethodDefinition } from './extract-resolver-method-definition';

export const extractResolverDefinition = (
  classDeclaration: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
  filePath: string,
  diagnostics: NestBridgeDiagnostic[],
) => {
  const resolverName = classDeclaration.name?.text ?? '(anonymous resolver)';

  const methods = classDeclaration.members
    .filter((member): member is ts.MethodDeclaration => ts.isMethodDeclaration(member))
    .map((method) =>
      extractResolverMethodDefinition(method, {
        sourceFile,
        filePath,
        resolverName,
        diagnostics,
      }),
    )
    .filter((method) => method !== undefined);

  return {
    name: resolverName,
    sourceFile: filePath,
    methods,
  };
};
