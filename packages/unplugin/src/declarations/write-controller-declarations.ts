import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { type ControllerDefinition, generateControllerDeclaration } from '@nestbridge/core';
import { mirroredDeclarationPath } from './mirror-declaration-path';

export const writeControllerDeclarations = (
  controllers: readonly ControllerDefinition[],
  root: string,
  outputDir: string,
) => {
  for (const controller of controllers) {
    const outputFilePath = mirroredDeclarationPath(root, outputDir, controller.sourceFile);
    mkdirSync(dirname(outputFilePath), { recursive: true });
    writeFileSync(
      outputFilePath,
      generateControllerDeclaration(controller, outputFilePath),
      'utf-8',
    );
  }
};
