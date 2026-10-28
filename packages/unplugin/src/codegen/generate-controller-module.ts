import type { ControllerDefinition, ControllerMethodDefinition } from '@nestbridge/core';
import { CONFIG_VIRTUAL_MODULE_ID } from '../virtual-modules';
import { generateBodyExpression } from './generate-body-expression';
import { generateHeadersExpression } from './generate-headers-expression';
import { generateMessageMethod } from './generate-message-method';
import { generateParameterList } from './generate-parameter-list';
import { generatePathExpression } from './generate-path-expression';
import { generateQueryExpression } from './generate-query-expression';
import { messageRuntimeFunctionOf } from './message-runtime-function';

const generateMethod = (method: ControllerMethodDefinition, service: string | undefined) => {
  const requestProperties = [
    `method: ${JSON.stringify(method.httpMethod)}`,
    `path: ${generatePathExpression(method)}`,
  ];

  if (service !== undefined) {
    requestProperties.push(`service: ${JSON.stringify(service)}`);
  }

  const queryExpression = generateQueryExpression(method.parameters);
  if (queryExpression !== undefined) {
    requestProperties.push(`query: ${queryExpression}`);
  }

  const bodyExpression = generateBodyExpression(method.parameters);
  if (bodyExpression !== undefined) {
    requestProperties.push(`body: ${bodyExpression}`);
  }

  const headersExpression = generateHeadersExpression(method.parameters);
  if (headersExpression !== undefined) {
    requestProperties.push(`headers: ${headersExpression}`);
  }

  if (method.responseKind === 'stream') {
    requestProperties.push(`responseType: "blob"`);
  }

  return [
    `  ${method.name}(${generateParameterList(method.parameters)}) {`,
    '    return request({',
    ...requestProperties.map((property) => `      ${property},`),
    '    });',
    '  }',
  ].join('\n');
};

const generateMessageMethods = (controller: ControllerDefinition, service: string | undefined) => {
  if (controller.messageHandlers.length === 0) {
    return [];
  }

  if (service === undefined) {
    throw new Error(
      `[nestbridge] ${controller.name} has message handlers, but its app has no \`name\` to address the service by.`,
    );
  }

  return controller.messageHandlers.map((handler) => generateMessageMethod(handler, service));
};

export const generateControllerModule = (controller: ControllerDefinition, service?: string) => {
  const methods = [
    ...controller.methods.map((method) => generateMethod(method, service)),
    ...generateMessageMethods(controller, service),
  ].join('\n\n');
  const messageRuntimeFunctions = Array.from(
    new Set(controller.messageHandlers.map((handler) => messageRuntimeFunctionOf(handler.kind))),
  ).sort();

  return [
    `import '${CONFIG_VIRTUAL_MODULE_ID}';`,
    "import { request } from 'nestbridge';",
    ...(messageRuntimeFunctions.length > 0
      ? [`import { ${messageRuntimeFunctions.join(', ')} } from 'nestbridge/microservices';`]
      : []),
    '',
    `export class ${controller.name} {`,
    '  constructor() {}',
    '',
    methods,
    '}',
    '',
  ].join('\n');
};
