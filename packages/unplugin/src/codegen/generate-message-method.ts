import type { MessageHandlerDefinition } from '@nestbridge/core';
import { messageRuntimeFunctionOf } from './message-runtime-function';

const PAYLOAD_PARAMETER = 'payload';

const EMPTY_PAYLOAD = '{}';

export const generateMessageMethod = (handler: MessageHandlerDefinition, service: string) => {
  const hasPayload = handler.payloadParameterIndex !== null;
  const messageProperties = [
    `service: ${JSON.stringify(service)}`,
    `pattern: ${JSON.stringify(handler.pattern)}`,
    hasPayload ? PAYLOAD_PARAMETER : `payload: ${EMPTY_PAYLOAD}`,
  ];

  return [
    `  ${handler.name}(${hasPayload ? PAYLOAD_PARAMETER : ''}) {`,
    `    return ${messageRuntimeFunctionOf(handler.kind)}({`,
    ...messageProperties.map((property) => `      ${property},`),
    '    });',
    '  }',
  ].join('\n');
};
