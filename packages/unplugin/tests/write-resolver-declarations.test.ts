import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ResolverDefinition } from '@nestbridge/core';
import { afterEach, describe, expect, it } from 'vitest';
import { writeResolverDeclarations } from '../src/declarations';

const fixturesRoot = resolve(import.meta.dirname, 'fixtures');
const outputDir = '.nestbridge-test-output-resolver';

afterEach(() => {
  rmSync(resolve(fixturesRoot, outputDir), { recursive: true, force: true });
});

describe('writeResolverDeclarations', () => {
  const resolver: ResolverDefinition = {
    name: 'UsersResolver',
    sourceFile: resolve(fixturesRoot, 'server/user.resolver.ts'),
    methods: [
      {
        name: 'findOne',
        operationKind: 'query',
        operationName: 'findOne',
        arguments: [
          {
            index: 0,
            parameterName: 'id',
            name: 'id',
            graphqlType: 'String!',
          },
        ],
        selection: [{ name: 'id' }, { name: 'name' }],
        line: 1,
        column: 1,
      },
    ],
  };

  it('writes a declaration file mirroring the resolver path under the output directory', () => {
    writeResolverDeclarations([resolver], fixturesRoot, outputDir);

    const outputFilePath = resolve(fixturesRoot, outputDir, 'server/user.resolver.d.ts');
    expect(existsSync(outputFilePath)).toBe(true);
    expect(readFileSync(outputFilePath, 'utf-8')).toContain('export declare class UsersResolver {');
  });

  it('writes a zero-argument constructor, excluding server-only implementation details', () => {
    writeResolverDeclarations([resolver], fixturesRoot, outputDir);

    const declaration = readFileSync(
      resolve(fixturesRoot, outputDir, 'server/user.resolver.d.ts'),
      'utf-8',
    );
    expect(declaration).toContain('constructor();');
    expect(declaration).not.toContain('UsersService');
  });
});
