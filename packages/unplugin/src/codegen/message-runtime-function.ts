import type { MessageKind } from '@nestbridge/core';

export const messageRuntimeFunctionOf = (kind: MessageKind) =>
  kind === 'event' ? 'emitMessage' : 'sendMessage';
