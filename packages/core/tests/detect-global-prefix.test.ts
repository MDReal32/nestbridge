import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectGlobalPrefix } from '../src/analysis';

const fixture = (name: string) => resolve(import.meta.dirname, 'fixtures', name);

describe('detectGlobalPrefix', () => {
  it('returns nothing, without diagnostics, when no prefix is set', () => {
    expect(detectGlobalPrefix(fixture('catch-filter-global.bootstrap.ts'))).toEqual({
      value: undefined,
      diagnostics: [],
    });
  });

  it('reads the literal prefix and its exclusions', () => {
    const { value, diagnostics } = detectGlobalPrefix(fixture('global-prefix.bootstrap.ts'));

    expect(diagnostics).toEqual([]);
    expect(value).toEqual({
      prefix: 'api/identity',
      exclude: [
        { path: 'health' },
        { path: 'oidc/interaction/:uid', httpMethod: 'GET' },
        { path: 'oidc/interaction/:uid/login', httpMethod: 'POST' },
        { path: 'every-method' },
      ],
    });
  });

  it('reads a prefix with no options and keeps it as written', () => {
    const { value } = detectGlobalPrefix(fixture('global-prefix-without-exclusions.bootstrap.ts'));

    expect(value).toEqual({ prefix: '/api/admin-panel/', exclude: [] });
  });

  it('reports a non-literal prefix instead of guessing', () => {
    const { value, diagnostics } = detectGlobalPrefix(
      fixture('global-prefix-non-literal.bootstrap.ts'),
    );

    expect(value).toBeUndefined();
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-global-prefix',
      detail: 'The global prefix must be a string literal.',
      found: 'app.setGlobalPrefix(env.GLOBAL_PREFIX)',
    });
  });

  it('reports a conditional call instead of assuming it always runs', () => {
    const { value, diagnostics } = detectGlobalPrefix(
      fixture('global-prefix-conditional.bootstrap.ts'),
    );

    expect(value).toBeUndefined();
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-global-prefix',
      detail: 'setGlobalPrefix() must be called exactly once and unconditionally.',
    });
  });

  it('reports exclusions that are not literals', () => {
    const { value, diagnostics } = detectGlobalPrefix(
      fixture('global-prefix-non-literal-exclusion.bootstrap.ts'),
    );

    expect(value).toBeUndefined();
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-global-prefix',
      detail: 'Global prefix exclusions must be statically analyzable.',
    });
  });
});
