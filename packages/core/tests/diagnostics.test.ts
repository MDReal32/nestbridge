import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeControllers } from '../src/analysis';
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
});
