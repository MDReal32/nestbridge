import type { Decorator, PropertyAssignment } from 'typescript/unstable/ast';
import {
  isCallExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isStringLiteralLikeNode,
} from 'typescript/unstable/ast';
import { readRouteVersion } from './read-route-version';

const PATH_OPTION_NAME = 'path';
const VERSION_OPTION_NAME = 'version';

const optionNameOf = (property: PropertyAssignment) => {
  const name = property.name;
  return isIdentifier(name) || isStringLiteralLikeNode(name) ? name.text : undefined;
};

export const readControllerOptions = (decorator: Decorator) => {
  const expression = decorator.expression;

  if (!isCallExpression(expression)) {
    return { ok: true as const, path: undefined, version: undefined };
  }

  const [firstArgument] = expression.arguments;

  if (firstArgument === undefined) {
    return { ok: true as const, path: undefined, version: undefined };
  }

  if (isStringLiteralLikeNode(firstArgument)) {
    return { ok: true as const, path: firstArgument.text, version: undefined };
  }

  if (!isObjectLiteralExpression(firstArgument)) {
    return { ok: false as const, argumentText: firstArgument.getText() };
  }

  let path: string | undefined;
  let version: string | null | undefined;

  for (const property of firstArgument.properties) {
    if (!isPropertyAssignment(property)) {
      return { ok: false as const, argumentText: firstArgument.getText() };
    }

    const optionName = optionNameOf(property);

    if (optionName === PATH_OPTION_NAME) {
      if (!isStringLiteralLikeNode(property.initializer)) {
        return { ok: false as const, argumentText: firstArgument.getText() };
      }

      path = property.initializer.text;
    }

    if (optionName === VERSION_OPTION_NAME) {
      const routeVersion = readRouteVersion(property.initializer);

      if (!routeVersion.ok) {
        return { ok: false as const, argumentText: firstArgument.getText() };
      }

      version = routeVersion.version;
    }
  }

  return { ok: true as const, path, version };
};
