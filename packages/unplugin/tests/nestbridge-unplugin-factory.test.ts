import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { UnpluginBuildContext, UnpluginContextMeta } from 'unplugin';
import { afterEach, describe, expect, it } from 'vitest';
import { nestBridgeUnplugin } from '../src/main';

const fixturesRoot = resolve(import.meta.dirname, 'fixtures/plugin-wiring');
const outputDir = '.nestbridge-test-output';
const mainFilePath = resolve(fixturesRoot, 'main.ts');
const declarationPath = resolve(
  fixturesRoot,
  outputDir,
  'widgets-server/server/widgets.controller.d.ts',
);
const interceptorFilePath = resolve(fixturesRoot, 'response.interceptor.ts');
const errorBodyDeclarationPath = resolve(fixturesRoot, outputDir, 'widgets-server/error-body.d.ts');

const meta: UnpluginContextMeta = { framework: 'vite', versions: {} };

const buildContext: UnpluginBuildContext = {
  addWatchFile: () => {},
  emitFile: () => {},
  getWatchFiles: () => [],
  parse: () => undefined,
};

const bootstrapWithoutInterceptor = readFileSync(mainFilePath, 'utf-8');

const bootstrapWithInterceptor = `import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { map } from 'rxjs';
import { AppModule } from './app.module';

@Injectable()
class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => ({ data: value, meta: { requestId: 'generated' } })));
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(3000);
}

bootstrap();
`;

const interceptorSource = (
  returnedObject: string,
) => `import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((value) => (${returnedObject})));
  }
}
`;

const bootstrapWithImportedInterceptor = `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(3000);
}

bootstrap();
`;

const bootstrapWithFilter = `import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

@Catch(HttpException)
class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    response.json({ statusCode: exception.getStatus(), message: exception.message });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3000);
}

bootstrap();
`;

afterEach(() => {
  rmSync(resolve(fixturesRoot, outputDir), { recursive: true, force: true });
  rmSync(interceptorFilePath, { force: true });
  writeFileSync(mainFilePath, bootstrapWithoutInterceptor, 'utf-8');
});

describe('nestBridgeUnplugin wiring', () => {
  it('leaves the generated declaration unwrapped when no global interceptor is detected', () => {
    const plugin = nestBridgeUnplugin.raw(
      { controllers: 'server/**/*.controller.ts', outputDir, root: fixturesRoot },
      meta,
    );

    plugin.buildStart?.call(buildContext);

    const declaration = readFileSync(declarationPath, 'utf-8');
    expect(declaration).toContain(
      "findOne(...args: Parameters<__ServerWidgetsController['findOne']>): RemoteResult<__ServerWidgetsController['findOne']>;",
    );
  });

  it('re-analyzes and wraps the response type when the bootstrap file changes to register a global interceptor', () => {
    const plugin = nestBridgeUnplugin.raw(
      { controllers: 'server/**/*.controller.ts', outputDir, root: fixturesRoot },
      meta,
    );

    plugin.buildStart?.call(buildContext);
    writeFileSync(mainFilePath, bootstrapWithInterceptor, 'utf-8');
    plugin.watchChange?.call(buildContext, mainFilePath, { event: 'update' });

    const declaration = readFileSync(declarationPath, 'utf-8');
    expect(declaration).toContain(
      'type __NestBridgeWrapped<T> = T extends (...args: never[]) => infer Result ? AbortablePromise<{ data: Awaited<Result>; meta: { requestId: string } }> : never;',
    );
    expect(declaration).toContain(
      "findOne(...args: Parameters<__ServerWidgetsController['findOne']>): __NestBridgeWrapped<__ServerWidgetsController['findOne']>;",
    );
  });

  it('writes the error body declaration when the bootstrap file changes to register a global exception filter', () => {
    const plugin = nestBridgeUnplugin.raw(
      { controllers: 'server/**/*.controller.ts', outputDir, root: fixturesRoot },
      meta,
    );

    plugin.buildStart?.call(buildContext);
    writeFileSync(mainFilePath, bootstrapWithFilter, 'utf-8');
    plugin.watchChange?.call(buildContext, mainFilePath, { event: 'update' });

    const declaration = readFileSync(errorBodyDeclarationPath, 'utf-8');
    expect(declaration).toContain(
      'export type NestBridgeErrorBody = { statusCode: number; message: string };',
    );
  });

  it('deletes the error body declaration once the exception filter is removed', () => {
    const plugin = nestBridgeUnplugin.raw(
      { controllers: 'server/**/*.controller.ts', outputDir, root: fixturesRoot },
      meta,
    );

    plugin.buildStart?.call(buildContext);
    writeFileSync(mainFilePath, bootstrapWithFilter, 'utf-8');
    plugin.watchChange?.call(buildContext, mainFilePath, { event: 'update' });
    expect(existsSync(errorBodyDeclarationPath)).toBe(true);

    writeFileSync(mainFilePath, bootstrapWithoutInterceptor, 'utf-8');
    plugin.watchChange?.call(buildContext, mainFilePath, { event: 'update' });

    expect(existsSync(errorBodyDeclarationPath)).toBe(false);
  });

  it('re-analyzes the declaration when an imported interceptor file changes', () => {
    const plugin = nestBridgeUnplugin.raw(
      { controllers: 'server/**/*.controller.ts', outputDir, root: fixturesRoot },
      meta,
    );
    writeFileSync(interceptorFilePath, interceptorSource('{ data: value }'), 'utf-8');
    writeFileSync(mainFilePath, bootstrapWithImportedInterceptor, 'utf-8');

    plugin.buildStart?.call(buildContext);
    expect(readFileSync(declarationPath, 'utf-8')).toContain(
      'AbortablePromise<{ data: Awaited<Result> }>',
    );

    writeFileSync(interceptorFilePath, interceptorSource('{ result: value }'), 'utf-8');
    plugin.watchChange?.call(buildContext, interceptorFilePath, { event: 'update' });

    expect(readFileSync(declarationPath, 'utf-8')).toContain(
      'AbortablePromise<{ result: Awaited<Result> }>',
    );
  });

  it('fails a one-shot build on an unsupported interceptor and declares its routes as unknown', () => {
    const plugin = nestBridgeUnplugin.raw(
      { controllers: 'server/**/*.controller.ts', outputDir, root: fixturesRoot },
      { ...meta, watchMode: false },
    );
    writeFileSync(
      interceptorFilePath,
      interceptorSource('{ data: value, at: new Date() }'),
      'utf-8',
    );
    writeFileSync(mainFilePath, bootstrapWithImportedInterceptor, 'utf-8');

    expect(() => plugin.buildStart?.call(buildContext)).toThrow('Unsupported interceptor.');
  });

  it('warns instead of failing in watch mode and declares the routes as AbortablePromise<unknown>', () => {
    const plugin = nestBridgeUnplugin.raw(
      { controllers: 'server/**/*.controller.ts', outputDir, root: fixturesRoot },
      { ...meta, watchMode: true },
    );
    writeFileSync(
      interceptorFilePath,
      interceptorSource('{ data: value, at: new Date() }'),
      'utf-8',
    );
    writeFileSync(mainFilePath, bootstrapWithImportedInterceptor, 'utf-8');

    plugin.buildStart?.call(buildContext);

    expect(readFileSync(declarationPath, 'utf-8')).toContain(
      "findOne(...args: Parameters<__ServerWidgetsController['findOne']>): AbortablePromise<unknown>;",
    );
  });

  it('asks the bundler to watch the bootstrap file and the interceptor files it read', () => {
    const watchedFiles: string[] = [];
    const plugin = nestBridgeUnplugin.raw(
      { controllers: 'server/**/*.controller.ts', outputDir, root: fixturesRoot },
      meta,
    );
    writeFileSync(interceptorFilePath, interceptorSource('{ data: value }'), 'utf-8');
    writeFileSync(mainFilePath, bootstrapWithImportedInterceptor, 'utf-8');

    plugin.buildStart?.call({
      ...buildContext,
      addWatchFile: (file) => watchedFiles.push(file),
    });

    expect(watchedFiles).toContain(mainFilePath.replaceAll(sep, '/'));
    expect(watchedFiles).toContain(interceptorFilePath.replaceAll(sep, '/'));
  });
});
