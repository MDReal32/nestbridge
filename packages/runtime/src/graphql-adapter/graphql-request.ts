import { type AbortablePromise, createAbortablePromise } from '../abortable';
import type { NestBridgeGraphqlRequest } from './nestbridge-graphql-request';
import { sendGraphqlRequest } from './send-graphql-request';

export const graphqlRequest = <T>(
  nestBridgeGraphqlRequest: NestBridgeGraphqlRequest,
): AbortablePromise<T> =>
  createAbortablePromise((signal) => sendGraphqlRequest<T>(nestBridgeGraphqlRequest, signal));
