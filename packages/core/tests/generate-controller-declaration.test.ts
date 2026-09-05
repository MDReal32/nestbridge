import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeControllers } from '../src/analysis';
import { generateControllerDeclaration } from '../src/declarations';

const fixture = (name: string) => resolve(import.meta.dirname, 'fixtures', name);

describe('generateControllerDeclaration', () => {
  it('emits a declare class with a zero-argument constructor', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/widgets.controller.d.ts'),
    );

    expect(declaration).toContain('export declare class WidgetsController {');
    expect(declaration).toContain('  constructor();');
  });

  it('omits the dependency-injection constructor parameters', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/widgets.controller.d.ts'),
    );

    expect(declaration).not.toContain('usersService');
    expect(declaration).not.toContain('UsersService');
  });

  it('omits methods without an HTTP decorator', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/widgets.controller.d.ts'),
    );

    expect(declaration).not.toContain('helperNotAnEndpoint');
  });

  it('projects each exposed method as a method signature against the real controller type', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/widgets.controller.d.ts'),
    );

    expect(declaration).toContain(
      "findOne(...args: Parameters<__ServerWidgetsController['findOne']>): RemoteResult<__ServerWidgetsController['findOne']>;",
    );
    expect(declaration).toContain(
      "create(...args: Parameters<__ServerWidgetsController['create']>): RemoteResult<__ServerWidgetsController['create']>;",
    );
  });

  it('imports RemoteResult from @nestbridge/runtime', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/widgets.controller.d.ts'),
    );

    expect(declaration).toContain("import type { RemoteResult } from '@nestbridge/runtime';");
  });

  it('imports the real controller type relative to the declaration output path', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const outputFilePath = fixture('generated/widgets.controller.d.ts');
    const declaration = generateControllerDeclaration(controllers[0]!, outputFilePath);

    expect(declaration).toContain(
      "import type { WidgetsController as __ServerWidgetsController } from '../widgets.controller';",
    );
  });

  it('links back to the real controller file via an @see JSDoc tag', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const outputFilePath = fixture('generated/widgets.controller.d.ts');
    const declaration = generateControllerDeclaration(controllers[0]!, outputFilePath);

    expect(declaration).toContain('@see {@link ../widgets.controller.ts}');
  });

  it('projects a method with an inferred return type the same way as an annotated one', () => {
    const { controllers } = analyzeControllers([fixture('inferred-return-type.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/inferred-return-type.controller.d.ts'),
    );

    expect(declaration).toContain(
      "findOne(...args: Parameters<__ServerInferredReturnTypeController['findOne']>): RemoteResult<__ServerInferredReturnTypeController['findOne']>;",
    );
  });
});
