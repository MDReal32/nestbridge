import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeControllers, analyzeResolvers } from '../src/analysis';
import { formatDiagnostic } from '../src/diagnostics';

const fixture = (name: string) => resolve(import.meta.dirname, 'fixtures', name);

describe('diagnostics', () => {
  it('reports an unsupported-route diagnostic for a non-static route argument', () => {
    const { controllers, diagnostics } = analyzeControllers([
      fixture('unsupported-route.controller.ts'),
    ]);

    expect(controllers).toHaveLength(1);
    expect(controllers[0]?.methods).toHaveLength(0);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-route',
      controllerName: 'UnsupportedRouteController',
      memberName: 'findOne',
      found: '@Get(createRoute())',
    });
  });

  it('includes the exact source location in the diagnostic', () => {
    const { diagnostics } = analyzeControllers([fixture('unsupported-route.controller.ts')]);

    expect(diagnostics[0]?.filePath).toBe(fixture('unsupported-route.controller.ts'));
    expect(diagnostics[0]?.line).toBeGreaterThan(0);
    expect(diagnostics[0]?.column).toBeGreaterThan(0);
  });

  it('reports an unsupported-parameter diagnostic for @Req()', () => {
    const { diagnostics } = analyzeControllers([fixture('unsupported-parameter.controller.ts')]);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-parameter',
      controllerName: 'UnsupportedParameterController',
      memberName: 'profile',
    });
    expect(diagnostics[0]?.detail).toContain('@Req()');
  });

  it('formats a diagnostic into a human-readable multi-line message', () => {
    const { diagnostics } = analyzeControllers([fixture('unsupported-route.controller.ts')]);
    const message = formatDiagnostic(diagnostics[0]!);

    expect(message).toContain('[NestBridge] Unsupported route.');
    expect(message).toContain('Found:\n@Get(createRoute())');
    expect(message).toContain(`${fixture('unsupported-route.controller.ts')}:`);
  });

  it('reports an unsupported-route diagnostic for a non-statically-analyzable operation name', () => {
    const { resolvers, diagnostics } = analyzeResolvers([
      fixture('unsupported-operation-name.resolver.ts'),
    ]);

    expect(resolvers).toHaveLength(1);
    expect(resolvers[0]?.methods).toHaveLength(0);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-route',
      controllerName: 'UnsupportedOperationNameResolver',
      memberName: 'ping',
      found: '@Query(createName())',
    });
  });

  it('reports an unsupported-argument diagnostic for a resolver parameter without @Args()', () => {
    const { diagnostics } = analyzeResolvers([fixture('unsupported-argument.resolver.ts')]);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-argument',
      controllerName: 'UnsupportedArgumentResolver',
      memberName: 'echo',
    });
    expect(diagnostics[0]?.detail).toContain('@Args');
  });

  it('reports an unsupported-return-type diagnostic when neither a decorator type thunk nor a return type annotation is present', () => {
    const { diagnostics } = analyzeResolvers([fixture('no-return-type-source.resolver.ts')]);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-return-type',
      controllerName: 'NoReturnTypeSourceResolver',
      memberName: 'ping',
    });
  });

  it('reports an unsupported-return-type diagnostic for a field resolving to a non-@ObjectType() class', () => {
    const { diagnostics } = analyzeResolvers([fixture('non-object-type.resolver.ts')]);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-return-type',
      controllerName: 'NonObjectTypeResolver',
      memberName: 'findOne',
    });
    expect(diagnostics[0]?.detail).toContain('@ObjectType()');
  });

  it('reports a circular-type diagnostic for object types that reference each other', () => {
    const { diagnostics } = analyzeResolvers([fixture('circular.resolver.ts')]);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      code: 'circular-type',
      controllerName: 'CircularResolver',
      memberName: 'root',
    });
  });
});
