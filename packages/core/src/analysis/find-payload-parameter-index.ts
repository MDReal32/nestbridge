import type { MethodDeclaration } from 'typescript/unstable/ast';
import { findDecorator, hasAnyDecorator } from './decorator-inspection';

const PAYLOAD_DECORATOR_NAME = 'Payload';

/**
 * Nest passes the payload to the `@Payload()` parameter. Without decorators it passes it as the
 * first argument; once any parameter is decorated (`@Ctx()`, a custom decorator), undecorated
 * parameters receive nothing, so the handler takes no payload.
 */
export const findPayloadParameterIndex = (method: MethodDeclaration) => {
  const payloadIndex = method.parameters.findIndex(
    (parameter) => findDecorator(parameter, PAYLOAD_DECORATOR_NAME) !== undefined,
  );

  if (payloadIndex !== -1) {
    return payloadIndex;
  }

  if (method.parameters.length === 0 || method.parameters.some(hasAnyDecorator)) {
    return null;
  }

  return 0;
};
