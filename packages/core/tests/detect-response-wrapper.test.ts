import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectResponseWrapper } from '../src/analysis';

const fixture = (name: string) => resolve(import.meta.dirname, 'fixtures', name);

describe('detectResponseWrapper', () => {
  it('detects a global interceptor registered and defined across files', () => {
    const result = detectResponseWrapper(fixture('wrapped-response.bootstrap.ts'));

    expect(result).toEqual({
      wrappedResultTypeSource: '{ data: Awaited<Result>; meta: { requestId: string } }',
    });
  });

  it('returns undefined when no global interceptor is registered', () => {
    expect(detectResponseWrapper(fixture('widgets.controller.ts'))).toBeUndefined();
  });

  it('composes multiple global interceptors registered across separate calls, in registration order', () => {
    const result = detectResponseWrapper(fixture('two-global-interceptors.bootstrap.ts'));

    expect(result).toEqual({
      wrappedResultTypeSource:
        '{ data: { wrapped: Awaited<Result>; cached: boolean }; meta: { requestId: string } }',
    });
  });

  it('returns undefined when any interceptor in a chain has an unsupported shape', () => {
    expect(
      detectResponseWrapper(fixture('chained-interceptor-unsupported-shape.bootstrap.ts')),
    ).toBeUndefined();
  });

  it('returns undefined when the interceptor argument is not a `new` expression', () => {
    expect(
      detectResponseWrapper(fixture('non-new-expression-interceptor.bootstrap.ts')),
    ).toBeUndefined();
  });

  it('returns undefined when the intercept method chains more than one pipe operator', () => {
    expect(detectResponseWrapper(fixture('multi-operator-pipe.bootstrap.ts'))).toBeUndefined();
  });

  it('returns undefined when the pipe operator is not `map`', () => {
    expect(detectResponseWrapper(fixture('non-map-pipe-operator.bootstrap.ts'))).toBeUndefined();
  });

  it('returns undefined when `map` is not imported from rxjs', () => {
    expect(detectResponseWrapper(fixture('map-not-from-rxjs.bootstrap.ts'))).toBeUndefined();
  });

  it('returns undefined when the map callback does not take exactly one parameter', () => {
    expect(detectResponseWrapper(fixture('wrong-arity-map-callback.bootstrap.ts'))).toBeUndefined();
  });

  it('returns undefined when the map callback does not return an object literal', () => {
    expect(
      detectResponseWrapper(fixture('non-object-literal-response.bootstrap.ts')),
    ).toBeUndefined();
  });

  it('returns undefined when the payload parameter is referenced more than once', () => {
    expect(detectResponseWrapper(fixture('payload-referenced-twice.bootstrap.ts'))).toBeUndefined();
  });

  it('returns undefined when the payload parameter is never referenced', () => {
    expect(detectResponseWrapper(fixture('payload-never-referenced.bootstrap.ts'))).toBeUndefined();
  });

  it('returns undefined when a property value is an unsupported expression', () => {
    expect(
      detectResponseWrapper(fixture('unsupported-property-value.bootstrap.ts')),
    ).toBeUndefined();
  });
});
