import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeControllers } from '../src/analysis';

const fixture = (name: string) => resolve(import.meta.dirname, 'fixtures', name);

describe('analyzeControllers', () => {
  it('detects a decorated controller class and extracts its base path', () => {
    const { controllers, diagnostics } = analyzeControllers([fixture('widgets.controller.ts')]);

    expect(diagnostics).toEqual([]);
    expect(controllers).toHaveLength(1);
    expect(controllers[0]?.name).toBe('WidgetsController');
    expect(controllers[0]?.path).toBe('widgets');
    expect(controllers[0]?.sourceFile).toBe(fixture('widgets.controller.ts'));
  });

  it('ignores class members that are not HTTP-decorated endpoints', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const methodNames = controllers[0]?.methods.map((method) => method.name);

    expect(methodNames).not.toContain('helperNotAnEndpoint');
  });

  it.each([
    ['findOne', 'GET', '/widgets/:id'],
    ['search', 'GET', '/widgets'],
    ['filter', 'GET', '/widgets/filter'],
    ['create', 'POST', '/widgets'],
    ['replace', 'PUT', '/widgets/:id'],
    ['update', 'PATCH', '/widgets/:id'],
    ['remove', 'DELETE', '/widgets/:id'],
  ])('maps %s to %s %s', (methodName, httpMethod, path) => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const method = controllers[0]?.methods.find((candidate) => candidate.name === methodName);

    expect(method?.httpMethod).toBe(httpMethod);
    expect(method?.path).toBe(path);
  });

  it('extracts a named @Param parameter', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const method = controllers[0]?.methods.find((candidate) => candidate.name === 'findOne');

    expect(method?.parameters[0]).toMatchObject({
      kind: 'param',
      name: 'id',
      parameterName: 'id',
      index: 0,
    });
  });

  it('extracts a named @Query parameter', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const method = controllers[0]?.methods.find((candidate) => candidate.name === 'search');

    expect(method?.parameters[0]).toMatchObject({
      kind: 'query',
      name: 'name',
      parameterName: 'name',
    });
  });

  it('extracts a whole @Query parameter without a name', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const method = controllers[0]?.methods.find((candidate) => candidate.name === 'filter');

    expect(method?.parameters[0]).toMatchObject({
      kind: 'query',
      name: undefined,
      parameterName: 'query',
    });
  });

  it('extracts a whole @Body parameter', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const method = controllers[0]?.methods.find((candidate) => candidate.name === 'create');

    expect(method?.parameters[0]).toMatchObject({
      kind: 'body',
      name: undefined,
      parameterName: 'body',
    });
  });

  it('extracts a named @Headers parameter', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const method = controllers[0]?.methods.find((candidate) => candidate.name === 'byHeader');

    expect(method?.parameters[0]).toMatchObject({
      kind: 'header',
      name: 'x-example',
      parameterName: 'value',
    });
  });

  it('preserves parameter order across mixed decorator kinds', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const method = controllers[0]?.methods.find((candidate) => candidate.name === 'findOne');

    expect(method?.parameters.map((parameter) => parameter.index)).toEqual([0, 1]);
    expect(method?.parameters.map((parameter) => parameter.parameterName)).toEqual([
      'id',
      'details',
    ]);
  });

  it('records source location for each analyzed method', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const method = controllers[0]?.methods.find((candidate) => candidate.name === 'findOne');

    expect(method?.line).toBeGreaterThan(0);
    expect(method?.column).toBeGreaterThan(0);
  });

  it('exposes a method that relies on an inferred return type, without a diagnostic', () => {
    const { controllers, diagnostics } = analyzeControllers([
      fixture('inferred-return-type.controller.ts'),
    ]);

    expect(diagnostics).toEqual([]);
    expect(controllers[0]?.methods.map((method) => method.name)).toContain('findOne');
  });

  it('defaults a method\'s responseKind to "json"', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const method = controllers[0]?.methods.find((candidate) => candidate.name === 'findOne');

    expect(method?.responseKind).toBe('json');
  });

  it.each([
    ['watch', 'observable'],
    ['download', 'stream'],
    ['downloadAsync', 'stream'],
    ['plain', 'json'],
  ])('detects %s as responseKind %s, without a diagnostic', (methodName, responseKind) => {
    const { controllers, diagnostics } = analyzeControllers([fixture('streaming.controller.ts')]);
    const method = controllers[0]?.methods.find((candidate) => candidate.name === methodName);

    expect(diagnostics).toEqual([]);
    expect(method?.responseKind).toBe(responseKind);
  });
});
