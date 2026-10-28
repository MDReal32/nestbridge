import type { Expression, PropertyName } from 'typescript/unstable/ast';
import {
  isIdentifier,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isStringLiteralLikeNode,
} from 'typescript/unstable/ast';
import type { Checker } from 'typescript/unstable/sync';
import type { MessagePattern } from '../models/message-pattern';
import { readLiteralType } from './read-literal-type';

const readPropertyName = (name: PropertyName) => {
  if (isIdentifier(name) || isStringLiteralLikeNode(name) || isNumericLiteral(name)) {
    return name.text;
  }

  return undefined;
};

/**
 * Object literals are read from the syntax because the checker widens their property types
 * (`{ cmd: 'count' }` is `{ cmd: string }`). Everything else, including identifiers and property
 * accesses that point at `const` values or `as const` objects, is read from its literal type.
 */
export const readMessagePattern = (
  expression: Expression,
  checker: Checker,
): MessagePattern | undefined => {
  if (isStringLiteralLikeNode(expression)) {
    return expression.text;
  }

  if (isNumericLiteral(expression)) {
    return Number(expression.text);
  }

  if (!isObjectLiteralExpression(expression)) {
    const type = checker.getTypeAtLocation(expression);
    return type === undefined ? undefined : readLiteralType(type, checker, expression);
  }

  const pattern: Record<string, MessagePattern> = {};

  for (const property of expression.properties) {
    if (!isPropertyAssignment(property)) {
      return undefined;
    }

    const name = readPropertyName(property.name);
    const value = readMessagePattern(property.initializer, checker);

    if (name === undefined || value === undefined) {
      return undefined;
    }

    pattern[name] = value;
  }

  return pattern;
};
