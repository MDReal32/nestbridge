export type MessageKind = 'event' | 'message';

export const MESSAGE_PATTERN_DECORATOR_NAMES: Record<string, MessageKind> = {
  EventPattern: 'event',
  MessagePattern: 'message',
};
