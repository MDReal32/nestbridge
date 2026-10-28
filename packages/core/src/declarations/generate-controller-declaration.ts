import { dirname, extname, relative } from 'node:path';
import type { MessageHandlerDefinition } from '../models/message-handler-definition';
import type { ResponseKind } from '../models/response-kind';
import type { ResponseWrapperDetection } from '../models/response-wrapper-detection';

interface ClientDeclarationParameter {
  index: number;
  parameterName: string;
}

interface ClientDeclarationMethod {
  name: string;
  responseKind?: ResponseKind;
  parameters?: readonly ClientDeclarationParameter[];
  serverOnlyParameterIndexes?: readonly number[];
}

type ClientDeclarationMessageHandler = Pick<
  MessageHandlerDefinition,
  'name' | 'kind' | 'payloadParameterIndex'
>;

interface ClientDeclarationSource {
  name: string;
  sourceFile: string;
  methods: readonly ClientDeclarationMethod[];
  messageHandlers?: readonly ClientDeclarationMessageHandler[];
}

const REMOTE_RESULT_HELPERS: Record<ResponseKind, string> = {
  json: 'RemoteResult',
  observable: 'RemoteObservableResult',
  stream: 'RemoteStreamResult',
};

const WRAPPED_RESULT_HELPER = '__NestBridgeWrapped';

const ABORTABLE_PROMISE = 'AbortablePromise';

const MESSAGE_RESULT_HELPER = 'NestBridgeMessageResult';

const MESSAGE_PAYLOAD_PARAMETER = 'payload';

const toPosixPath = (filePath: string) => filePath.replace(/\\/g, '/');

const importSpecifierFor = (sourceFile: string, outputFilePath: string) => {
  if (
    !sourceFile.startsWith('.') &&
    !/^[A-Za-z]:[\\/]/.test(sourceFile) &&
    !sourceFile.startsWith('/')
  ) {
    return sourceFile;
  }

  const relativePath = toPosixPath(relative(dirname(outputFilePath), sourceFile));
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
};

const stripExtension = (filePath: string) => {
  const extension = extname(filePath);
  return extension.length > 0 ? filePath.slice(0, -extension.length) : filePath;
};

export const generateControllerDeclaration = (
  controller: ClientDeclarationSource,
  outputFilePath: string,
  responseWrapper?: ResponseWrapperDetection,
): string => {
  const sourceFileSpecifier = importSpecifierFor(controller.sourceFile, outputFilePath);
  const importSpecifier = stripExtension(sourceFileSpecifier);
  const serverAlias = `__Server${controller.name}`;

  const helperNameFor = (method: ClientDeclarationMethod) =>
    responseWrapper !== undefined && (method.responseKind ?? 'json') === 'json'
      ? WRAPPED_RESULT_HELPER
      : REMOTE_RESULT_HELPERS[method.responseKind ?? 'json'];

  const parameterListFor = (method: ClientDeclarationMethod) => {
    const serverParameters = `Parameters<${serverAlias}['${method.name}']>`;

    if ((method.serverOnlyParameterIndexes ?? []).length === 0) {
      return `...args: ${serverParameters}`;
    }

    return [...(method.parameters ?? [])]
      .sort((a, b) => a.index - b.index)
      .map((parameter) => `${parameter.parameterName}: ${serverParameters}[${parameter.index}]`)
      .join(', ');
  };

  const methodDeclarations = controller.methods.map((method) => {
    const helperName = helperNameFor(method);
    return `  ${method.name}(${parameterListFor(method)}): ${helperName}<${serverAlias}['${method.name}']>;`;
  });

  const messageHandlers = controller.messageHandlers ?? [];

  const messageHandlerDeclarations = messageHandlers.map((handler) => {
    const serverMethod = `${serverAlias}['${handler.name}']`;
    const parameterList =
      handler.payloadParameterIndex === null
        ? ''
        : `${MESSAGE_PAYLOAD_PARAMETER}: Parameters<${serverMethod}>[${handler.payloadParameterIndex}]`;
    const result =
      handler.kind === 'event' ? 'void' : `${MESSAGE_RESULT_HELPER}<ReturnType<${serverMethod}>>`;

    return `  ${handler.name}(${parameterList}): Promise<${result}>;`;
  });

  const classBody = [
    '  constructor();',
    '',
    ...methodDeclarations,
    ...messageHandlerDeclarations,
  ].join('\n');

  const rawHelperNames = controller.methods.map((method) => helperNameFor(method));
  const hasWrappedMethod = rawHelperNames.includes(WRAPPED_RESULT_HELPER);
  const remoteHelperImports = Array.from(
    new Set(
      rawHelperNames.map((name) => (name === WRAPPED_RESULT_HELPER ? ABORTABLE_PROMISE : name)),
    ),
  ).sort();
  const helperImports =
    remoteHelperImports.length === 0 && messageHandlers.length === 0
      ? ['RemoteResult']
      : remoteHelperImports;
  const usesMessageResult = messageHandlers.some((handler) => handler.kind === 'message');

  const wrappedResultTypeAliasLines =
    responseWrapper !== undefined && hasWrappedMethod
      ? [
          `type ${WRAPPED_RESULT_HELPER}<T> = T extends (...args: never[]) => infer Result ? ${ABORTABLE_PROMISE}<${responseWrapper.wrappedResultTypeSource}> : never;`,
          '',
        ]
      : [];

  return [
    `import type { ${controller.name} as ${serverAlias} } from '${importSpecifier}';`,
    ...(helperImports.length > 0
      ? [`import type { ${helperImports.join(', ')} } from 'nestbridge';`]
      : []),
    ...(usesMessageResult
      ? [`import type { ${MESSAGE_RESULT_HELPER} } from 'nestbridge/microservices';`]
      : []),
    '',
    '/**',
    ' * Generated by NestBridge — client-facing methods only.',
    ` * @see {@link ${sourceFileSpecifier}} for the real controller implementation.`,
    ' */',
    ...wrappedResultTypeAliasLines,
    `export declare class ${controller.name} {`,
    classBody,
    '}',
    '',
  ].join('\n');
};
