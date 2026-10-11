import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectVersioning } from '../src/analysis';

const fixture = (name: string) => resolve(import.meta.dirname, 'fixtures', name);

describe('detectVersioning', () => {
  it('returns nothing, without diagnostics, when versioning is not enabled', () => {
    expect(detectVersioning(fixture('catch-filter-global.bootstrap.ts'))).toEqual({
      value: undefined,
      diagnostics: [],
    });
  });

  it('defaults the URI version prefix to v', () => {
    const { value, diagnostics } = detectVersioning(fixture('versioning-uri.bootstrap.ts'));

    expect(diagnostics).toEqual([]);
    expect(value).toEqual({ prefix: 'v' });
  });

  it('reads a custom prefix and the first default version', () => {
    const { value } = detectVersioning(fixture('versioning-uri-options.bootstrap.ts'));

    expect(value).toEqual({ prefix: 'api-v', defaultVersion: '1' });
  });

  it('reads prefix: false as an empty prefix and a neutral default as no default', () => {
    const { value } = detectVersioning(fixture('versioning-uri-no-prefix.bootstrap.ts'));

    expect(value).toEqual({ prefix: '' });
  });

  it('reports header versioning, which needs request headers NestBridge cannot set', () => {
    const { value, diagnostics } = detectVersioning(fixture('versioning-header.bootstrap.ts'));

    expect(value).toBeUndefined();
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-versioning',
      detail: 'Only VersioningType.URI is supported.',
    });
  });

  it('reports a non-literal default version', () => {
    const { value, diagnostics } = detectVersioning(fixture('versioning-non-literal.bootstrap.ts'));

    expect(value).toBeUndefined();
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-versioning',
      detail: 'The default version must be a string literal.',
    });
  });

  it('reports enableVersioning() being called more than once', () => {
    const { value, diagnostics } = detectVersioning(fixture('versioning-twice.bootstrap.ts'));

    expect(value).toBeUndefined();
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-versioning',
      detail: 'enableVersioning() must be called exactly once and unconditionally.',
    });
  });
});
