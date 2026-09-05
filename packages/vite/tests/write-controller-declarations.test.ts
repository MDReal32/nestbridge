import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ControllerDefinition } from '@nestbridge/core';
import { afterEach, describe, expect, it } from 'vitest';
import { mirroredDeclarationPath, writeControllerDeclarations } from '../src/declarations';

const fixturesRoot = resolve(import.meta.dirname, 'fixtures');
const outputDir = '.nestbridge-test-output';

afterEach(() => {
  rmSync(resolve(fixturesRoot, outputDir), { recursive: true, force: true });
});

describe('mirroredDeclarationPath', () => {
  it('mirrors a controller path relative to root, stripping leading parent segments', () => {
    const controllerFile = resolve(fixturesRoot, 'server/widgets.controller.ts');
    const outputFilePath = mirroredDeclarationPath(
      resolve(fixturesRoot, 'client'),
      '.nestbridge',
      controllerFile,
    );

    expect(outputFilePath).toBe(
      resolve(fixturesRoot, 'client', '.nestbridge', 'server/widgets.controller.d.ts'),
    );
  });
});

describe('writeControllerDeclarations', () => {
  const controller: ControllerDefinition = {
    name: 'WidgetsController',
    path: 'widgets',
    sourceFile: resolve(fixturesRoot, 'server/widgets.controller.ts'),
    methods: [
      {
        name: 'findOne',
        httpMethod: 'GET',
        path: '/widgets/:id',
        parameters: [
          {
            index: 0,
            kind: 'param',
            name: 'id',
            parameterName: 'id',
          },
        ],
        responseKind: 'json',
        line: 1,
        column: 1,
      },
    ],
  };

  it('writes a declaration file mirroring the controller path under the output directory', () => {
    writeControllerDeclarations([controller], fixturesRoot, outputDir);

    const outputFilePath = resolve(fixturesRoot, outputDir, 'server/widgets.controller.d.ts');
    expect(existsSync(outputFilePath)).toBe(true);
    expect(readFileSync(outputFilePath, 'utf-8')).toContain(
      'export declare class WidgetsController {',
    );
  });

  it('writes a zero-argument constructor, excluding server-only implementation details', () => {
    writeControllerDeclarations([controller], fixturesRoot, outputDir);

    const declaration = readFileSync(
      resolve(fixturesRoot, outputDir, 'server/widgets.controller.d.ts'),
      'utf-8',
    );
    expect(declaration).toContain('constructor();');
    expect(declaration).not.toContain('UsersService');
  });
});
