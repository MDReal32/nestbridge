import { describe, expect, it } from 'vitest';
import { analyzeWithBootstrap, wrapperOf } from './analyze-with-bootstrap';

const CONTROLLER = 'interceptors/plain.controller.ts';
const UNKNOWN_WRAPPER = { wrappedResultTypeSource: 'unknown' };

describe('response wrapper from global interceptors', () => {
  it('detects a global interceptor registered and defined across files', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'wrapped-response.bootstrap.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toEqual({
      wrappedResultTypeSource: '{ data: Awaited<Result>; meta: { requestId: string } }',
    });
    expect(wrapperOf(result, 'list')).toEqual(wrapperOf(result, 'findOne'));
  });

  it('leaves every method unwrapped when no global interceptor is registered', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'global-prefix.bootstrap.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toBeUndefined();
  });

  it('leaves every method unwrapped without a bootstrap file', () => {
    const result = analyzeWithBootstrap(CONTROLLER);

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toBeUndefined();
  });

  it('composes interceptors registered across separate calls, first registered outermost', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'two-global-interceptors.bootstrap.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toEqual({
      wrappedResultTypeSource:
        '{ data: { wrapped: Awaited<Result>; cached: boolean }; meta: { requestId: string } }',
    });
  });

  it('treats a tap-only interceptor as shape-neutral next to a map interceptor', () => {
    const result = analyzeWithBootstrap(
      CONTROLLER,
      'chained-interceptor-unsupported-shape.bootstrap.ts',
    );

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toEqual({
      wrappedResultTypeSource: '{ data: Awaited<Result> }',
    });
  });

  it('accepts a pipe with several operators where tap comes before map', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'multi-operator-pipe.bootstrap.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toEqual({
      wrappedResultTypeSource: '{ data: Awaited<Result> }',
    });
  });

  it('composes the map operators of one pipe in order, ignoring neutral ones in between', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'interceptors/mixed-operators.bootstrap.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toEqual({
      wrappedResultTypeSource: '{ second: { first: Awaited<Result> }; step: number }',
    });
  });

  it('resolves an operator by its imported name, so aliased imports work', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'interceptors/aliased-operator.bootstrap.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toEqual({
      wrappedResultTypeSource: '{ value: Awaited<Result> }',
    });
  });
});

describe('interceptor body and payload synthesis', () => {
  it('treats a shorthand property named like the callback parameter as the substitution', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'interceptors/shorthand.bootstrap.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toEqual({
      wrappedResultTypeSource: '{ data: Awaited<Result>; meta: { version: number } }',
    });
  });

  it('types arithmetic with -, *, / and % as number', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'interceptors/arithmetic.bootstrap.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toEqual({
      wrappedResultTypeSource:
        '{ value: Awaited<Result>; tookMs: number; doubled: number; ratio: number; remainder: number }',
    });
  });

  it('does not type + because it can produce a string', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'interceptors/plus-operator.bootstrap.ts');

    expect(wrapperOf(result, 'findOne')).toEqual(UNKNOWN_WRAPPER);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'unsupported-interceptor',
      controllerName: 'PlusInterceptor',
      memberName: 'intercept',
    });
    expect(result.diagnostics[0]?.detail).toContain('can be a string or a number');
  });

  it('allows statements before the final return and resolves a returned local', () => {
    const result = analyzeWithBootstrap(
      CONTROLLER,
      'interceptors/statements-before-return.bootstrap.ts',
    );

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toEqual({
      wrappedResultTypeSource: '{ value: Awaited<Result>; tookMs: number }',
    });
  });

  it('rejects an intercept() that returns before its last statement', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'interceptors/early-return.bootstrap.ts');

    expect(wrapperOf(result, 'findOne')).toEqual(UNKNOWN_WRAPPER);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'unsupported-interceptor',
      controllerName: 'EarlyReturnInterceptor',
    });
  });

  it('adds nothing for tap, timeout and finalize', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'interceptors/neutral-operators.bootstrap.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toBeUndefined();
  });

  it('adds nothing for a tap-only pipe', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'non-map-pipe-operator.bootstrap.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toBeUndefined();
  });

  it('treats a bare next.handle() as the identity', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'interceptors/bare-handle.bootstrap.ts');

    expect(result.diagnostics).toEqual([]);
    expect(wrapperOf(result, 'findOne')).toBeUndefined();
  });
});

describe('unsupported interceptors', () => {
  it.each([
    ['interceptors/retry-operator.bootstrap.ts', 'RetryInterceptor'],
    ['interceptors/tap-from-local.bootstrap.ts', 'LocalTapInterceptor'],
    ['interceptors/foreign-pipe-source.bootstrap.ts', 'ForeignPipeSourceInterceptor'],
    ['map-not-from-rxjs.bootstrap.ts', 'CustomMapInterceptor'],
    ['wrong-arity-map-callback.bootstrap.ts', 'WrongArityInterceptor'],
    ['non-object-literal-response.bootstrap.ts', 'PassthroughInterceptor'],
    ['payload-referenced-twice.bootstrap.ts', 'DuplicatePayloadInterceptor'],
    ['payload-never-referenced.bootstrap.ts', 'StaticPayloadInterceptor'],
    ['unsupported-property-value.bootstrap.ts', 'TimestampedInterceptor'],
  ])('reports %s once and declares every route unknown', (bootstrap, className) => {
    const result = analyzeWithBootstrap(CONTROLLER, bootstrap);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'unsupported-interceptor',
      controllerName: className,
      memberName: 'intercept',
    });
    expect(result.diagnostics[0]?.detail).not.toBe('');
    expect(result.diagnostics[0]?.expected).not.toBe('');
    expect(wrapperOf(result, 'findOne')).toEqual(UNKNOWN_WRAPPER);
    expect(wrapperOf(result, 'list')).toEqual(UNKNOWN_WRAPPER);
  });

  it('reports a registration that is not a new expression at the registration site', () => {
    const result = analyzeWithBootstrap(CONTROLLER, 'non-new-expression-interceptor.bootstrap.ts');

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'unsupported-interceptor',
      found: 'existingInterceptor',
    });
    expect(result.diagnostics[0]?.filePath).toContain(
      'non-new-expression-interceptor.bootstrap.ts',
    );
    expect(wrapperOf(result, 'findOne')).toEqual(UNKNOWN_WRAPPER);
  });
});
