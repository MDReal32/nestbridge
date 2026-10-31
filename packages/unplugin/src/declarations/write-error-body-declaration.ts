import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { type ErrorResponseShapeDetection, generateErrorBodyDeclaration } from '@nestbridge/core';
import { writeFileLocked } from './write-file-locked';

export const ERROR_BODY_DECLARATION_FILE_NAME = 'error-body.d.ts';

export const errorBodyDeclarationPath = (resolvedOutputDir: string) =>
  join(resolvedOutputDir, ERROR_BODY_DECLARATION_FILE_NAME);

export const writeErrorBodyDeclaration = (
  resolvedOutputDir: string,
  errorResponseShape?: ErrorResponseShapeDetection,
) => {
  const outputFilePath = errorBodyDeclarationPath(resolvedOutputDir);

  if (errorResponseShape === undefined) {
    rmSync(outputFilePath, { force: true });
    return;
  }

  mkdirSync(dirname(outputFilePath), { recursive: true });
  writeFileLocked(
    outputFilePath,
    generateErrorBodyDeclaration(errorResponseShape.errorBodyTypeSource),
  );
};
