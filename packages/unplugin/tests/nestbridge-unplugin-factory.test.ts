import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { UnpluginBuildContext, UnpluginContextMeta } from 'unplugin';
import { afterEach, describe, expect, it } from 'vitest';
import { nestBridgeUnplugin } from '../src/main';

const fixturesRoot = resolve(import.meta.dirname, 'fixtures/plugin-wiring');
const outputDir = '.nestbridge-test-output';
const mainFilePath = resolve(fixturesRoot, 'main.ts');
const declarationPath = resolve(fixturesRoot, outputDir, 'server/widgets.controller.d.ts');
const errorBodyDeclarationPath = resolve(fixturesRoot, outputDir, 'nestbridge-error-body.d.ts');

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
      'type __NestBridgeWrapped<T> = T extends (...args: never[]) => infer Result ? Promise<{ data: Awaited<Result>; meta: { requestId: string } }> : never;',
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
});
