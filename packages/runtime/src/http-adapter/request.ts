import { type AbortablePromise, createAbortablePromise } from '../abortable';
import type { NestBridgeRequest } from './nestbridge-request';
import { sendRequest } from './send-request';

export const request = <T>(nestBridgeRequest: NestBridgeRequest): AbortablePromise<T> =>
  createAbortablePromise((signal) => sendRequest<T>(nestBridgeRequest, signal));
