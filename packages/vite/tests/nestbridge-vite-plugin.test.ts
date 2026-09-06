import { readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { build, type Rollup } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';
import { nestBridge } from '../src/plugin';

const fixturesRoot = resolve(import.meta.dirname, 'fixtures');
const clientRoot = resolve(fixturesRoot, 'client');

const runBuild = async () => {
  const result = await build({
    root: clientRoot,
    logLevel: 'silent',
    configFile: false,
    build: {
      write: false,
      minify: false,
      lib: {
        entry: resolve(clientRoot, 'main.ts'),
        formats: ['es'],
        fileName: () => 'bundle.js',
      },
      rollupOptions: {
        external: ['nestbridge'],
      },
    },
    plugins: [
      nestBridge({
        controllers: '../server/**/*.controller.ts',
        resolvers: '../server/**/*.resolver.ts',
        baseURL: '/api',
      }),
    ],
  });

  const output = (Array.isArray(result) ? result[0] : result) as Rollup.RollupOutput;
  const chunk = output.output.find((item): item is Rollup.OutputChunk => item.type === 'chunk');

  if (chunk === undefined) {
    throw new Error('Expected the build to produce a JS chunk.');
  }

  return chunk.code;
};

afterEach(() => {
  rmSync(resolve(clientRoot, '.nestbridge'), { recursive: true, force: true });
});

describe('nestBridge vite plugin', () => {
  it('intercepts the direct controller import and replaces it with a generated module', async () => {
    const code = await runBuild();

    expect(code).toMatch(/from ['"]nestbridge['"]/);
    expect(code).toContain('class WidgetsController');
  });

  it('excludes the real controller implementation and NestJS dependencies from the bundle', async () => {
    const code = await runBuild();

    expect(code).not.toContain('UsersService');
    expect(code).not.toContain('usersService');
    expect(code).not.toContain('@nestjs/common');
  });

  it('writes a client-facing declaration file with a zero-argument constructor', async () => {
    await runBuild();

    const declaration = readFileSync(
      resolve(clientRoot, '.nestbridge', 'server', 'widgets.controller.d.ts'),
      'utf-8',
    );

    expect(declaration).toContain('export declare class WidgetsController {');
    expect(declaration).toContain('constructor();');
    expect(declaration).not.toContain('UsersService');
  });

  it('intercepts the direct resolver import and replaces it with a generated module', async () => {
    const code = await runBuild();

    expect(code).toMatch(/from ['"]nestbridge['"]/);
    expect(code).toContain('class UsersResolver');
    expect(code).toContain('graphqlRequest');
  });

  it('excludes the real resolver implementation and NestJS dependencies from the bundle', async () => {
    const code = await runBuild();

    expect(code).not.toContain('usersService');
    expect(code).not.toContain('@nestjs/graphql');
  });

  it('writes a client-facing resolver declaration file with a zero-argument constructor', async () => {
    await runBuild();

    const declaration = readFileSync(
      resolve(clientRoot, '.nestbridge', 'server', 'user.resolver.d.ts'),
      'utf-8',
    );

    expect(declaration).toContain('export declare class UsersResolver {');
    expect(declaration).toContain('constructor();');
    expect(declaration).not.toContain('UsersService');
  });
});
