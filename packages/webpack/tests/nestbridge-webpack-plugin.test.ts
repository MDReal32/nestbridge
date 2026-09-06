import { readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import webpack, { type Stats } from 'webpack';
import { nestBridge } from '../src/main';

const fixturesRoot = resolve(import.meta.dirname, 'fixtures');
const clientRoot = resolve(fixturesRoot, 'client');
const outputRoot = resolve(clientRoot, 'dist');

const runBuild = async () => {
  const compiler = webpack({
    mode: 'development',
    devtool: false,
    context: clientRoot,
    entry: resolve(clientRoot, 'main.ts'),
    target: 'node',
    output: {
      path: outputRoot,
      filename: 'bundle.js',
      library: { type: 'commonjs2' },
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    externalsType: 'commonjs2',
    externals: {
      nestbridge: 'nestbridge',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'esbuild-loader',
          options: { target: 'esnext' },
        },
      ],
    },
    plugins: [
      nestBridge({
        root: clientRoot,
        controllers: '../server/**/*.controller.ts',
        resolvers: '../server/**/*.resolver.ts',
        baseURL: '/api',
      }),
    ],
  });

  const stats = await new Promise<Stats>((resolvePromise, rejectPromise) => {
    compiler.run((error, result) => {
      if (error) {
        rejectPromise(error);
        return;
      }

      if (result === undefined) {
        rejectPromise(new Error('Expected webpack to produce stats.'));
        return;
      }

      compiler.close(() => resolvePromise(result));
    });
  });

  if (stats.hasErrors()) {
    throw new Error(stats.toString({ colors: false }));
  }

  return readFileSync(resolve(outputRoot, 'bundle.js'), 'utf-8');
};

afterEach(() => {
  rmSync(resolve(clientRoot, '.nestbridge'), { recursive: true, force: true });
  rmSync(outputRoot, { recursive: true, force: true });
});

describe('nestBridge webpack plugin', () => {
  it('intercepts the direct controller import and replaces it with a generated module', async () => {
    const code = await runBuild();

    expect(code).toMatch(/require\(["']nestbridge["']\)/);
    expect(code).toContain('class WidgetsController');
  });

  it('configures nestbridge with the plugin baseURL option', async () => {
    const code = await runBuild();

    expect(code).toMatch(/setNestBridgeBaseURL\)?\("\/api"\)/);
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

    expect(code).toMatch(/require\(["']nestbridge["']\)/);
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
