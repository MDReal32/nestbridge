import type { Expression } from 'typescript/unstable/ast';
import {
  isArrayLiteralExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isStringLiteralLikeNode,
} from 'typescript/unstable/ast';
import type { GlobalPrefixExclusion } from '../models/global-prefix-exclusion';
import type { HttpMethod } from '../models/http-method';

const REQUEST_METHOD_ENUM_NAME = 'RequestMethod';
const REQUEST_METHOD_ALL_NAME = 'ALL';
const EXCLUDE_OPTION_NAME = 'exclude';
const PATH_PROPERTY_NAME = 'path';
const METHOD_PROPERTY_NAME = 'method';
const SUPPORTED_EXCLUSION_PATH = /^[A-Za-z0-9_\-./:*]*$/;
const REQUEST_METHODS: Record<string, HttpMethod | undefined> = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

const readExclusionPath = (expression: Expression) =>
  isStringLiteralLikeNode(expression) && SUPPORTED_EXCLUSION_PATH.test(expression.text)
    ? expression.text
    : undefined;

const readRequestMethod = (expression: Expression) => {
  if (
    !isPropertyAccessExpression(expression) ||
    !isIdentifier(expression.expression) ||
    expression.expression.text !== REQUEST_METHOD_ENUM_NAME
  ) {
    return undefined;
  }

  const methodName = expression.name.text;

  if (methodName === REQUEST_METHOD_ALL_NAME) {
    return { httpMethod: undefined, generated: true };
  }

  const httpMethod = REQUEST_METHODS[methodName];
  return { httpMethod, generated: httpMethod !== undefined };
};

const readExclusion = (element: Expression) => {
  if (isStringLiteralLikeNode(element)) {
    const path = readExclusionPath(element);
    return path === undefined ? undefined : { exclusion: { path } satisfies GlobalPrefixExclusion };
  }

  if (!isObjectLiteralExpression(element)) {
    return undefined;
  }

  let path: string | undefined;
  let httpMethod: HttpMethod | undefined;

  for (const property of element.properties) {
    if (!isPropertyAssignment(property)) {
      return undefined;
    }

    const propertyName = property.name.getText();

    if (propertyName === PATH_PROPERTY_NAME) {
      path = readExclusionPath(property.initializer);
    }

    if (propertyName === METHOD_PROPERTY_NAME) {
      const requestMethod = readRequestMethod(property.initializer);

      if (requestMethod === undefined) {
        return undefined;
      }

      if (!requestMethod.generated) {
        return { exclusion: undefined };
      }

      httpMethod = requestMethod.httpMethod;
    }
  }

  if (path === undefined) {
    return undefined;
  }

  return { exclusion: httpMethod === undefined ? { path } : { path, httpMethod } };
};

/**
 * Returns `undefined` when an entry cannot be read statically. Entries for request methods
 * NestBridge never generates (OPTIONS, HEAD, SEARCH) are dropped because they cannot match.
 */
export const readGlobalPrefixExclusions = (options: Expression | undefined) => {
  if (options === undefined) {
    return [];
  }

  if (!isObjectLiteralExpression(options)) {
    return undefined;
  }

  const exclusions: GlobalPrefixExclusion[] = [];

  for (const property of options.properties) {
    if (!isPropertyAssignment(property)) {
      return undefined;
    }

    if (property.name.getText() !== EXCLUDE_OPTION_NAME) {
      continue;
    }

    if (!isArrayLiteralExpression(property.initializer)) {
      return undefined;
    }

    for (const element of property.initializer.elements) {
      const entry = readExclusion(element);

      if (entry === undefined) {
        return undefined;
      }

      if (entry.exclusion !== undefined) {
        exclusions.push(entry.exclusion);
      }
    }
  }

  return exclusions;
};
