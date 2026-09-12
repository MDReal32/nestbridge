import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectErrorResponseShape } from '../src/analysis';

const fixture = (name: string) => resolve(import.meta.dirname, 'fixtures', name);

describe('detectErrorResponseShape', () => {
  it('detects a global exception filter registered via useGlobalFilters', () => {
    const result = detectErrorResponseShape(fixture('catch-filter-global.bootstrap.ts'));

    expect(result).toEqual({
      errorBodyTypeSource: '{ statusCode: number; message: string }',
    });
  });

  it('detects an exception filter registered via an APP_FILTER provider, widening aliased members', () => {
    const result = detectErrorResponseShape(fixture('app-filter-provider-response.bootstrap.ts'));

    expect(result).toEqual({
      errorBodyTypeSource: '{ statusCode: number; message: string }',
    });
  });

  it('returns undefined when no exception filter is registered', () => {
    expect(detectErrorResponseShape(fixture('widgets.controller.ts'))).toBeUndefined();
  });

  it('returns undefined when useGlobalFilters and an APP_FILTER provider register different classes', () => {
    expect(
      detectErrorResponseShape(fixture('conflicting-filter-registrations.bootstrap.ts')),
    ).toBeUndefined();
  });

  it('returns undefined when the class is not decorated with @Catch', () => {
    expect(
      detectErrorResponseShape(fixture('missing-catch-decorator.bootstrap.ts')),
    ).toBeUndefined();
  });

  it('returns undefined when the filter argument is not a `new` expression', () => {
    expect(
      detectErrorResponseShape(fixture('non-new-expression-filter.bootstrap.ts')),
    ).toBeUndefined();
  });

  it('returns undefined when an APP_FILTER provider uses useValue instead of useClass', () => {
    expect(detectErrorResponseShape(fixture('app-filter-use-value.bootstrap.ts'))).toBeUndefined();
  });

  it('returns undefined when the providers array contains a spread element', () => {
    expect(
      detectErrorResponseShape(fixture('app-filter-providers-spread.bootstrap.ts')),
    ).toBeUndefined();
  });

  it('returns undefined when multiple distinct classes are registered via APP_FILTER', () => {
    expect(
      detectErrorResponseShape(fixture('app-filter-multiple-classes.bootstrap.ts')),
    ).toBeUndefined();
  });

  it('returns undefined when the catch method does not call `.json` or `.send`', () => {
    expect(
      detectErrorResponseShape(fixture('filter-non-json-response.bootstrap.ts')),
    ).toBeUndefined();
  });

  it('returns undefined when the catch method branches', () => {
    expect(
      detectErrorResponseShape(fixture('filter-branching-response.bootstrap.ts')),
    ).toBeUndefined();
  });

  it('returns undefined when the response body argument is not an object literal', () => {
    expect(
      detectErrorResponseShape(fixture('filter-non-object-response.bootstrap.ts')),
    ).toBeUndefined();
  });

  it('returns undefined when a property value is an unsupported expression', () => {
    expect(
      detectErrorResponseShape(fixture('filter-unsupported-property.bootstrap.ts')),
    ).toBeUndefined();
  });
});
