import type { MessageKind } from './message-kind';
import type { MessagePattern } from './message-pattern';

export interface MessageHandlerDefinition {
  name: string;
  kind: MessageKind;
  pattern: MessagePattern;
  /**
   * Position of the parameter the client sends as the message payload, or `null` when the
   * handler takes no payload (no parameters, or only parameters the server resolves itself,
   * such as `@Ctx()`).
   */
  payloadParameterIndex: number | null;
  line: number;
  column: number;
}
