import type { TypeNode } from 'typescript/unstable/ast';
import { isIdentifier, isTypeReferenceNode } from 'typescript/unstable/ast';
import type { ResponseKind } from '../models/response-kind';
import { unwrapPromise } from './graphql-scalar-type';

const OBSERVABLE_TYPE_NAME = 'Observable';
const STREAMABLE_FILE_TYPE_NAME = 'StreamableFile';

export const readResponseKind = (returnType: TypeNode | undefined): ResponseKind => {
  if (returnType === undefined) {
    return 'json';
  }

  const unwrapped = unwrapPromise(returnType);

  if (!isTypeReferenceNode(unwrapped) || !isIdentifier(unwrapped.typeName)) {
    return 'json';
  }

  if (unwrapped.typeName.text === OBSERVABLE_TYPE_NAME) {
    return 'observable';
  }

  if (unwrapped.typeName.text === STREAMABLE_FILE_TYPE_NAME) {
    return 'stream';
  }

  return 'json';
};
