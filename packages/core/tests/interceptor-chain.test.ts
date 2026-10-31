import { describe, expect, it } from 'vitest';
import { analyzeWithBootstrap, fixture, wrapperOf } from './analyze-with-bootstrap';

const PLAIN_CONTROLLER = 'interceptors/plain.controller.ts';
const UNKNOWN_WRAPPER = { wrappedResultTypeSource: 'unknown' };

describe('APP_INTERCEPTOR providers', () => {
  it('chains root, imported modules depth-first, then useGlobalInterceptors', () => {
    const result = analyzeWithBootstrap(PLAIN_CONTROLLER, 'interceptors/app-interceptor/main.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toEqual({
      wrappedResultTypeSource:
        '{ root: { alpha: { gamma: { beta: { bootstrap: Awaited<Result> } } } } }',
    });
    expect(wrapperOf(result, 'list')).toEqual(wrapperOf(result, 'findOne'));
  });

  it('puts module providers outside useGlobalInterceptors, matching the order Nest registers them', () => {
    const result = analyzeWithBootstrap(PLAIN_CONTROLLER, 'interceptors/app-interceptor/main.ts');
    const source = wrapperOf(result, 'findOne')?.wrappedResultTypeSource ?? '';

    expect(source.indexOf('root:')).toBeLessThan(source.indexOf('bootstrap:'));
    expect(source.indexOf('beta:')).toBeLessThan(source.indexOf('bootstrap:'));
  });

  it('reports the files that contributed to interceptor detection', () => {
    const result = analyzeWithBootstrap(PLAIN_CONTROLLER, 'interceptors/app-interceptor/main.ts');

    expect(result.interceptorFiles.map((path) => path.replaceAll('\\', '/'))).toContain(
      fixture('interceptors/app-interceptor/wrapping.interceptors.ts').replaceAll('\\', '/'),
    );
  });

  it('reads APP_INTERCEPTOR providers from the root module even when nothing is registered in main', () => {
    const result = analyzeWithBootstrap(
      PLAIN_CONTROLLER,
      'interceptors/app-interceptor-use-factory/main.ts',
    );

    expect(wrapperOf(result, 'findOne')).toEqual(UNKNOWN_WRAPPER);
  });

  it.each([
    ['use-factory', 'useFactory'],
    ['use-value', 'useValue'],
    ['use-existing', 'useExisting'],
    ['spread', 'spread'],
  ])('reports one diagnostic for an unsupported %s provider', (fixtureName, keyword) => {
    const result = analyzeWithBootstrap(
      PLAIN_CONTROLLER,
      `interceptors/app-interceptor-${fixtureName}/main.ts`,
    );

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'unsupported-interceptor',
      controllerName: '(interceptors)',
    });
    expect(result.diagnostics[0]?.filePath).toContain('app.module.ts');
    expect(result.diagnostics[0]?.detail.toLowerCase()).toContain(keyword.toLowerCase());
    expect(wrapperOf(result, 'findOne')).toEqual(UNKNOWN_WRAPPER);
    expect(wrapperOf(result, 'list')).toEqual(UNKNOWN_WRAPPER);
  });

  it('ignores an APP_INTERCEPTOR that is not imported from @nestjs/core', () => {
    const result = analyzeWithBootstrap(
      PLAIN_CONTROLLER,
      'interceptors/app-interceptor-not-from-nest/main.ts',
    );

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toBeUndefined();
  });
});

describe('@UseInterceptors', () => {
  const BOOTSTRAP = 'interceptors/use-interceptors/main.ts';

  it('chains global, then controller-class, then method interceptors', () => {
    const result = analyzeWithBootstrap(
      'interceptors/use-interceptors/layered.controller.ts',
      BOOTSTRAP,
    );

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'list')).toEqual({
      wrappedResultTypeSource: '{ global: { classOne: { classTwo: Awaited<Result> } } }',
    });
    expect(wrapperOf(result, 'findOne')).toEqual({
      wrappedResultTypeSource:
        '{ global: { classOne: { classTwo: { method: Awaited<Result> } } } }',
    });
  });

  it('applies stacked decorators bottom-up, as Nest does', () => {
    const result = analyzeWithBootstrap('interceptors/use-interceptors/stacked.controller.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'list')).toEqual({
      wrappedResultTypeSource: '{ bottom: { top: Awaited<Result> } }',
    });
  });

  it('reports an argument that is neither a class nor a new expression', () => {
    const result = analyzeWithBootstrap(
      'interceptors/use-interceptors/unsupported-argument.controller.ts',
    );

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'unsupported-interceptor',
      found: 'createInterceptor()',
    });
    expect(wrapperOf(result, 'list')).toEqual(UNKNOWN_WRAPPER);
    expect(wrapperOf(result, 'findOne')).toBeUndefined();
  });

  it('reports an interceptor class that does not resolve to local source once', () => {
    const result = analyzeWithBootstrap(
      'interceptors/use-interceptors/package-interceptor.controller.ts',
    );

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'unsupported-interceptor',
      controllerName: 'ClassSerializerInterceptor',
    });
    expect(wrapperOf(result, 'list')).toEqual(UNKNOWN_WRAPPER);
    expect(wrapperOf(result, 'findOne')).toEqual(UNKNOWN_WRAPPER);
  });

  it('ignores a UseInterceptors that is not imported from @nestjs/common', () => {
    const result = analyzeWithBootstrap(
      'interceptors/use-interceptors/local-decorator.controller.ts',
    );

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'list')).toBeUndefined();
  });

  it('does not wrap or report streaming routes', () => {
    const result = analyzeWithBootstrap('interceptors/use-interceptors/streaming.controller.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'watch')).toBeUndefined();
  });
});
