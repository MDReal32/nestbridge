import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeControllers } from '../src/analysis';

const fixture = (name: string) => resolve(import.meta.dirname, 'fixtures', name);

const methodOf = (controllerName: string, methodName: string) => {
  const { controllers } = analyzeControllers([fixture('versioned.controller.ts')]);
  const controller = controllers.find((candidate) => candidate.name === controllerName);
  return controller?.methods.find((candidate) => candidate.name === methodName);
};

describe('analyzeControllers with controller options and versions', () => {
  it('reads the path of a @Controller({ path, version }) object', () => {
    const { controllers, diagnostics } = analyzeControllers([fixture('versioned.controller.ts')]);

    expect(diagnostics).toEqual([]);
    expect(controllers.map((controller) => controller.path)).toEqual([
      'users',
      '',
      'plain',
      'multi',
    ]);
  });

  it('inherits the controller version on methods without @Version', () => {
    expect(methodOf('UsersController', 'list')?.version).toBe('1');
    expect(methodOf('UsersController', 'list')?.path).toBe('/users');
  });

  it('lets a method @Version override the controller version', () => {
    expect(methodOf('UsersController', 'findOne')?.version).toBe('2');
  });

  it('reads VERSION_NEUTRAL as null on a method and on a controller', () => {
    expect(methodOf('UsersController', 'health')?.version).toBeNull();
    expect(methodOf('NeutralController', 'show')?.version).toBeNull();
  });

  it('uses the first entry of a version array', () => {
    expect(methodOf('UsersController', 'create')?.version).toBe('3');
    expect(methodOf('MultiVersionController', 'list')?.version).toBe('5');
  });

  it('leaves the version undefined when none is stated', () => {
    expect(methodOf('UnversionedController', 'list')?.version).toBeUndefined();
  });

  it('reports a non-literal controller version instead of guessing', () => {
    const { controllers, diagnostics } = analyzeControllers([
      fixture('unsupported-controller-version.controller.ts'),
    ]);

    expect(controllers).toEqual([]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-route',
      controllerName: 'UsersController',
      found: "@Controller({ path: 'users', version: CURRENT_VERSION })",
    });
  });

  it('reports a non-literal method version and skips the method', () => {
    const { controllers, diagnostics } = analyzeControllers([
      fixture('unsupported-method-version.controller.ts'),
    ]);

    expect(controllers[0]?.methods).toEqual([]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-route',
      controllerName: 'UsersController',
      memberName: 'list',
      found: '@Version(CURRENT_VERSION)',
    });
  });
});
