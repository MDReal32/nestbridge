import type { ClassDeclaration, MethodDeclaration, SourceFile } from 'typescript/unstable/ast';
import { isMethodDeclaration } from 'typescript/unstable/ast';
import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';
import { extractResolverMethodDefinition } from './extract-resolver-method-definition';

export const extractResolverDefinition = (
  classDeclaration: ClassDeclaration,
  sourceFile: SourceFile,
  filePath: string,
  diagnostics: NestBridgeDiagnostic[],
) => {
  const resolverName = classDeclaration.name?.text ?? '(anonymous resolver)';

  const methods = classDeclaration.members
    .filter((member): member is MethodDeclaration => isMethodDeclaration(member))
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
