import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ErrorResponseShapeDetection } from '@nestbridge/core';
import { afterEach, describe, expect, it } from 'vitest';
import { errorBodyDeclarationPath, writeErrorBodyDeclaration } from '../src/declarations';

const fixturesRoot = resolve(import.meta.dirname, 'fixtures');
const outputDir = '.nestbridge-test-output-error-body';
const resolvedOutputDir = resolve(fixturesRoot, outputDir);

afterEach(() => {
  rmSync(resolvedOutputDir, { recursive: true, force: true });
});

describe('errorBodyDeclarationPath', () => {
  it('points at a fixed nestbridge-error-body.d.ts under the output directory', () => {
    const outputFilePath = errorBodyDeclarationPath(resolvedOutputDir);

    expect(outputFilePath).toBe(resolve(resolvedOutputDir, 'nestbridge-error-body.d.ts'));
  });
});

describe('writeErrorBodyDeclaration', () => {
  const errorResponseShape: ErrorResponseShapeDetection = {
    errorBodyTypeSource: '{ statusCode: number; message: string }',
  };

  it('writes a declaration file when an error response shape is detected', () => {
    writeErrorBodyDeclaration(resolvedOutputDir, errorResponseShape);

    const outputFilePath = errorBodyDeclarationPath(resolvedOutputDir);
    expect(existsSync(outputFilePath)).toBe(true);
    expect(readFileSync(outputFilePath, 'utf-8')).toContain(
      'export type NestBridgeErrorBody = { statusCode: number; message: string };',
    );
  });

  it('does not write a declaration file when no error response shape is detected', () => {
    writeErrorBodyDeclaration(resolvedOutputDir, undefined);

    expect(existsSync(errorBodyDeclarationPath(resolvedOutputDir))).toBe(false);
  });

  it('deletes an existing declaration file once the error response shape is no longer detected', () => {
    writeErrorBodyDeclaration(resolvedOutputDir, errorResponseShape);
    const outputFilePath = errorBodyDeclarationPath(resolvedOutputDir);
    expect(existsSync(outputFilePath)).toBe(true);

    writeErrorBodyDeclaration(resolvedOutputDir, undefined);

    expect(existsSync(outputFilePath)).toBe(false);
  });
});
