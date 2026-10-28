import type { Node } from 'typescript/unstable/ast';
import type { Checker, Type } from 'typescript/unstable/sync';
import type { MessagePattern } from '../models/message-pattern';

export const readLiteralType = (
  type: Type,
  checker: Checker,
  location: Node,
): MessagePattern | undefined => {
  if (type.isStringLiteralType() || type.isNumberLiteralType() || type.isBooleanLiteralType()) {
    return type.value;
  }

  if (!type.isObjectType()) {
    return undefined;
  }

  const pattern: Record<string, MessagePattern> = {};

  for (const property of checker.getPropertiesOfType(type)) {
    const value = readLiteralType(
      checker.getTypeOfSymbolAtLocation(property, location),
      checker,
      location,
    );

    if (value === undefined) {
      return undefined;
    }

    pattern[property.name] = value;
  }

  return pattern;
};
