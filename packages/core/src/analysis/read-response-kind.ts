import ts from 'typescript';
import type { ResponseKind } from '../models/response-kind';
import { unwrapPromise } from './graphql-scalar-type';

const OBSERVABLE_TYPE_NAME = 'Observable';
const STREAMABLE_FILE_TYPE_NAME = 'StreamableFile';

export const readResponseKind = (returnType: ts.TypeNode | undefined): ResponseKind => {
  if (returnType === undefined) {
    return 'json';
  }

  const unwrapped = unwrapPromise(returnType);

  if (!ts.isTypeReferenceNode(unwrapped) || !ts.isIdentifier(unwrapped.typeName)) {
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
