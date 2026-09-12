import { NestBridgeError } from './nestbridge-error';

export const isNestBridgeError = <T = unknown>(error: unknown): error is NestBridgeError<T> =>
  error instanceof NestBridgeError;
