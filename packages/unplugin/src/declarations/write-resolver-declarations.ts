import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { generateControllerDeclaration, type ResolverDefinition } from '@nestbridge/core';
import { mirroredDeclarationPath } from './mirror-declaration-path';

export const writeResolverDeclarations = (
  resolvers: readonly ResolverDefinition[],
  sourceRoot: string,
  resolvedOutputDir: string,
) => {
  for (const resolver of resolvers) {
    const outputFilePath = mirroredDeclarationPath(
      sourceRoot,
      resolvedOutputDir,
      resolver.sourceFile,
    );
    mkdirSync(dirname(outputFilePath), { recursive: true });
    writeFileSync(outputFilePath, generateControllerDeclaration(resolver, outputFilePath), 'utf-8');
  }
};
