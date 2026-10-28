import type { ControllerMethodDefinition } from './controller-method-definition';
import type { MessageHandlerDefinition } from './message-handler-definition';

export interface ControllerDefinition {
  name: string;
  path: string;
  sourceFile: string;
  methods: ControllerMethodDefinition[];
  messageHandlers: MessageHandlerDefinition[];
}
