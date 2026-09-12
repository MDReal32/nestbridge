import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  type ControllerDefinition,
  generateControllerDeclaration,
  type ResponseWrapperDetection,
} from '@nestbridge/core';
import { mirroredDeclarationPath } from './mirror-declaration-path';

export const writeControllerDeclarations = (
  controllers: readonly ControllerDefinition[],
  root: string,
  outputDir: string,
  responseWrapper?: ResponseWrapperDetection,
) => {
  for (const controller of controllers) {
    const outputFilePath = mirroredDeclarationPath(root, outputDir, controller.sourceFile);
    mkdirSync(dirname(outputFilePath), { recursive: true });
    writeFileSync(
      outputFilePath,
      generateControllerDeclaration(controller, outputFilePath, responseWrapper),
      'utf-8',
    );
  }
};
