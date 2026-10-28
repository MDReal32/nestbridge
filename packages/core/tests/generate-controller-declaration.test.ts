import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeControllers } from '../src/analysis';
import { generateControllerDeclaration } from '../src/declarations';
import type { ResponseWrapperDetection } from '../src/models';

const fixture = (name: string) => resolve(import.meta.dirname, 'fixtures', name);

const responseWrapper: ResponseWrapperDetection = {
  wrappedResultTypeSource: '{ data: Awaited<Result>; meta: { requestId: string } }',
};

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

  it('omits server-resolved parameters from the client signature', () => {
    const { controllers } = analyzeControllers([
      fixture('custom-parameter-decorator.controller.ts'),
    ]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/custom-parameter-decorator.controller.d.ts'),
    );

    expect(declaration).toContain(
      "me(): RemoteResult<__ServerCustomParameterDecoratorController['me']>;",
    );
    expect(declaration).toContain(
      "audit(id: Parameters<__ServerCustomParameterDecoratorController['audit']>[1]): RemoteResult<__ServerCustomParameterDecoratorController['audit']>;",
    );
  });

  it('imports RemoteResult from @nestbridge/runtime', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/widgets.controller.d.ts'),
    );

    expect(declaration).toContain("import type { RemoteResult } from 'nestbridge';");
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

  it('projects an Observable-returning method through RemoteObservableResult', () => {
    const { controllers } = analyzeControllers([fixture('streaming.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/streaming.controller.d.ts'),
    );

    expect(declaration).toContain(
      "watch(...args: Parameters<__ServerStreamingController['watch']>): RemoteObservableResult<__ServerStreamingController['watch']>;",
    );
  });

  it('projects a StreamableFile-returning method through RemoteStreamResult', () => {
    const { controllers } = analyzeControllers([fixture('streaming.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/streaming.controller.d.ts'),
    );

    expect(declaration).toContain(
      "download(...args: Parameters<__ServerStreamingController['download']>): RemoteStreamResult<__ServerStreamingController['download']>;",
    );
    expect(declaration).toContain(
      "downloadAsync(...args: Parameters<__ServerStreamingController['downloadAsync']>): RemoteStreamResult<__ServerStreamingController['downloadAsync']>;",
    );
  });

  it('imports only the RemoteResult helpers actually used by the controller', () => {
    const { controllers } = analyzeControllers([fixture('streaming.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/streaming.controller.d.ts'),
    );

    expect(declaration).toContain(
      "import type { RemoteObservableResult, RemoteResult, RemoteStreamResult } from 'nestbridge';",
    );
  });

  it('projects JSON-returning methods through the local wrapped-result helper when a response wrapper is detected', () => {
    const { controllers } = analyzeControllers([fixture('streaming.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/streaming.controller.d.ts'),
      responseWrapper,
    );

    expect(declaration).toContain(
      "plain(...args: Parameters<__ServerStreamingController['plain']>): __NestBridgeWrapped<__ServerStreamingController['plain']>;",
    );
  });

  it('emits a local __NestBridgeWrapped type alias built from the detected wrapper shape', () => {
    const { controllers } = analyzeControllers([fixture('streaming.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/streaming.controller.d.ts'),
      responseWrapper,
    );

    expect(declaration).toContain(
      'type __NestBridgeWrapped<T> = T extends (...args: never[]) => infer Result ? AbortablePromise<{ data: Awaited<Result>; meta: { requestId: string } }> : never;',
    );
  });

  it('leaves Observable- and StreamableFile-returning methods unwrapped even when a response wrapper is detected', () => {
    const { controllers } = analyzeControllers([fixture('streaming.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/streaming.controller.d.ts'),
      responseWrapper,
    );

    expect(declaration).toContain(
      "watch(...args: Parameters<__ServerStreamingController['watch']>): RemoteObservableResult<__ServerStreamingController['watch']>;",
    );
    expect(declaration).toContain(
      "download(...args: Parameters<__ServerStreamingController['download']>): RemoteStreamResult<__ServerStreamingController['download']>;",
    );
    expect(declaration).not.toContain(
      "import type { RemoteObservableResult, RemoteResult, RemoteStreamResult } from 'nestbridge';",
    );
    expect(declaration).toContain(
      "import type { AbortablePromise, RemoteObservableResult, RemoteStreamResult } from 'nestbridge';",
    );
  });

  it('imports only AbortablePromise when every method resolves to the wrapped-result helper', () => {
    const { controllers } = analyzeControllers([fixture('widgets.controller.ts')]);
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/widgets.controller.d.ts'),
      responseWrapper,
    );

    expect(declaration).toContain("import type { AbortablePromise } from 'nestbridge';");
    expect(declaration).not.toContain('RemoteResult');
    expect(declaration).toContain(
      "findOne(...args: Parameters<__ServerWidgetsController['findOne']>): __NestBridgeWrapped<__ServerWidgetsController['findOne']>;",
    );
  });

  it('declares message handlers next to HTTP methods, typed from the server class', () => {
    const { controllers } = analyzeControllers([fixture('emails.controller.ts')], {
      messagePatterns: true,
    });
    const declaration = generateControllerDeclaration(
      controllers[0]!,
      fixture('generated/emails.controller.d.ts'),
    );

    expect(declaration).toContain("import type { RemoteResult } from 'nestbridge';");
    expect(declaration).toContain(
      "import type { NestBridgeMessageResult } from 'nestbridge/microservices';",
    );
    expect(declaration).toContain(
      "  find(...args: Parameters<__ServerEmailsController['find']>): RemoteResult<__ServerEmailsController['find']>;\n" +
        "  handleEmailRequested(payload: Parameters<__ServerEmailsController['handleEmailRequested']>[0]): Promise<void>;\n",
    );
    expect(declaration).toContain(
      "  count(): Promise<NestBridgeMessageResult<ReturnType<__ServerEmailsController['count']>>>;",
    );
    expect(declaration).toContain(
      "  sum(payload: Parameters<__ServerEmailsController['sum']>[1]): Promise<NestBridgeMessageResult<ReturnType<__ServerEmailsController['sum']>>>;",
    );
  });

  it('imports nothing from nestbridge for a controller with only events', () => {
    const declaration = generateControllerDeclaration(
      {
        name: 'AuditController',
        sourceFile: fixture('audit.controller.ts'),
        methods: [],
        messageHandlers: [{ name: 'record', kind: 'event', payloadParameterIndex: 0 }],
      },
      fixture('generated/audit.controller.d.ts'),
    );

    expect(declaration).not.toContain("from 'nestbridge'");
    expect(declaration).not.toContain("from 'nestbridge/microservices'");
    expect(declaration).toContain(
      "  record(payload: Parameters<__ServerAuditController['record']>[0]): Promise<void>;",
    );
  });
});
