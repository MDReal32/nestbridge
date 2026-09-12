import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { type ErrorResponseShapeDetection, generateErrorBodyDeclaration } from '@nestbridge/core';

export const ERROR_BODY_DECLARATION_FILE_NAME = 'nestbridge-error-body.d.ts';

export const errorBodyDeclarationPath = (root: string, outputDir: string) =>
  join(root, outputDir, ERROR_BODY_DECLARATION_FILE_NAME);

export const writeErrorBodyDeclaration = (
  root: string,
  outputDir: string,
  errorResponseShape?: ErrorResponseShapeDetection,
) => {
  const outputFilePath = errorBodyDeclarationPath(root, outputDir);

  if (errorResponseShape === undefined) {
    rmSync(outputFilePath, { force: true });
    return;
  }

  mkdirSync(dirname(outputFilePath), { recursive: true });
  writeFileSync(
    outputFilePath,
    generateErrorBodyDeclaration(errorResponseShape.errorBodyTypeSource),
    'utf-8',
  );
};
