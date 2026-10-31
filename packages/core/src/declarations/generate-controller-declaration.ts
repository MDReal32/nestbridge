import { dirname, extname, relative } from 'node:path';
import type { MessageHandlerDefinition } from '../models/message-handler-definition';
import type { ResponseKind } from '../models/response-kind';
import type { ResponseWrapperDetection } from '../models/response-wrapper-detection';
import { WRAPPED_RESULT_SUBSTITUTION } from '../models/response-wrapper-substitution';

interface ClientDeclarationParameter {
  index: number;
  parameterName: string;
}

interface ClientDeclarationMethod {
  name: string;
  responseKind?: ResponseKind;
  responseWrapper?: ResponseWrapperDetection;
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

const dependsOnServerResult = (wrapper: ResponseWrapperDetection) =>
  wrapper.wrappedResultTypeSource.includes(WRAPPED_RESULT_SUBSTITUTION);

const wrapperOf = (method: ClientDeclarationMethod) =>
  (method.responseKind ?? 'json') === 'json' ? method.responseWrapper : undefined;

/**
 * Wrappers that depend on the server result get a generic alias, in order of first use, so the
 * first one keeps the name `__NestBridgeWrapped`. A wrapper that does not depend on it, such as
 * `unknown`, is written inline.
 */
const aliasedWrapperSourcesOf = (methods: readonly ClientDeclarationMethod[]) => {
  const sources = new Set<string>();

  for (const method of methods) {
    const wrapper = wrapperOf(method);

    if (wrapper !== undefined && dependsOnServerResult(wrapper)) {
      sources.add(wrapper.wrappedResultTypeSource);
    }
  }

  return [...sources];
};

const wrapperHelperName = (aliasIndex: number) =>
  aliasIndex === 0 ? WRAPPED_RESULT_HELPER : `${WRAPPED_RESULT_HELPER}${aliasIndex + 1}`;

export const generateControllerDeclaration = (
  controller: ClientDeclarationSource,
  outputFilePath: string,
): string => {
  const sourceFileSpecifier = importSpecifierFor(controller.sourceFile, outputFilePath);
  const importSpecifier = stripExtension(sourceFileSpecifier);
  const serverAlias = `__Server${controller.name}`;

  const aliasedWrapperSources = aliasedWrapperSourcesOf(controller.methods);

  const resultTypeFor = (method: ClientDeclarationMethod) => {
    const serverMethod = `${serverAlias}['${method.name}']`;
    const wrapper = wrapperOf(method);

    if (wrapper === undefined) {
      return `${REMOTE_RESULT_HELPERS[method.responseKind ?? 'json']}<${serverMethod}>`;
    }

    if (!dependsOnServerResult(wrapper)) {
      return `${ABORTABLE_PROMISE}<${wrapper.wrappedResultTypeSource}>`;
    }

    const aliasIndex = aliasedWrapperSources.indexOf(wrapper.wrappedResultTypeSource);
    return `${wrapperHelperName(aliasIndex)}<${serverMethod}>`;
  };

  const importedHelperFor = (method: ClientDeclarationMethod) =>
    wrapperOf(method) === undefined
      ? REMOTE_RESULT_HELPERS[method.responseKind ?? 'json']
      : ABORTABLE_PROMISE;

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

  const methodDeclarations = controller.methods.map(
    (method) => `  ${method.name}(${parameterListFor(method)}): ${resultTypeFor(method)};`,
  );

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

  const remoteHelperImports = Array.from(
    new Set(controller.methods.map((method) => importedHelperFor(method))),
  ).sort();
  const helperImports =
    remoteHelperImports.length === 0 && messageHandlers.length === 0
      ? ['RemoteResult']
      : remoteHelperImports;
  const usesMessageResult = messageHandlers.some((handler) => handler.kind === 'message');

  const wrappedResultTypeAliasLines =
    aliasedWrapperSources.length === 0
      ? []
      : [
          ...aliasedWrapperSources.map(
            (source, aliasIndex) =>
              `type ${wrapperHelperName(aliasIndex)}<T> = T extends (...args: never[]) => infer Result ? ${ABORTABLE_PROMISE}<${source}> : never;`,
          ),
          '',
        ];

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
