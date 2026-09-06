import type { ControllerDefinition, ControllerMethodDefinition } from '@nestbridge/core';
import { CONFIG_VIRTUAL_MODULE_ID } from '../virtual-modules';
import { generateBodyExpression } from './generate-body-expression';
import { generateHeadersExpression } from './generate-headers-expression';
import { generateParameterList } from './generate-parameter-list';
import { generatePathExpression } from './generate-path-expression';
import { generateQueryExpression } from './generate-query-expression';

const generateMethod = (method: ControllerMethodDefinition) => {
  const requestProperties = [
    `method: ${JSON.stringify(method.httpMethod)}`,
    `path: ${generatePathExpression(method)}`,
  ];

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

export const generateControllerModule = (controller: ControllerDefinition) => {
  const methods = controller.methods.map(generateMethod).join('\n\n');

  return [
    `import '${CONFIG_VIRTUAL_MODULE_ID}';`,
    "import { request } from 'nestbridge';",
    '',
    `export class ${controller.name} {`,
    '  constructor() {}',
    '',
    methods,
    '}',
    '',
  ].join('\n');
};
